const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const userModel = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken')
const verifyToken = require('../middleware/auth.middleware');
const Seller = require('../models/seller.model')
const multer = require('multer')
const path = require('path')
const Menu = require('../models/menu.model')
const puppeteer = require("puppeteer");
const Order = require('../models/order.model')
const mongoose = require('mongoose')
const User = require('../models/user.model')
const ejs = require("ejs");

const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.get('/register', (req, res) => {
  res.render('signup')
})

// router.get('/', async (req, res) => {
//   console.log("hello")

//   const sellers = await Seller.find()

//   console.log(sellers)
//   res.render('index')
// })





async function generatePDF(order) {
    try {
        // Render the EJS template
        const filePath = path.join(__dirname, "../views/order-invoice.ejs");
        const html = await ejs.renderFile(filePath, { order });

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });

        // Define the PDF file path with string interpolation
        const pdfPath = path.join(__dirname, "../public/invoices", `order-${order._id}.pdf`);
        
        // Generate PDF
        await page.pdf({ path: pdfPath, format: "A4" });

        await browser.close();
        return pdfPath;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
}


// Call this function when order is marked as delivered
router.get("/download-invoice/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).send("Order not found");

        // order.status = "Delivered";
        // await order.save();

        const pdfPath = await generatePDF(order);
        
        const pdfPath1 = path.join(__dirname, '..', 'public', 'invoices', `order-${orderId}.pdf`);

        console.log(pdfPath1)
        res.download(pdfPath1); 
        // res.send({ message: "Order delivered, PDF generated", pdfPath });
    } catch (err) {
        res.status(500).send("Error marking order as delivered");
    }
});

router.get('/seller',verifyToken ,async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sellers = await Seller.findById( req.user.userId )
    console.log(sellers)
    // Assuming the seller ID is available in req.user.userId from verifyToken middleware
    const orders = await Order.find().sort({ date: -1 }); // Get all orders, sorted by date
    const menus = await Menu.find({ sellerid: req.user.userId });
    const todaysOrders = await Order.find({
      date: { $gte: today }
    });
    const token = req.cookies.token;

    res.render('tiffinseller', { orders,menus,todaysOrders,sellers,isAuthenticated: !!token });
 

    
    

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Server error');
  }
});


router.get('/menu/:id', async (req, res) => {
    try {
        let sellerId = req.params.id;
        const seller = await Seller.findOne({ _id: sellerId });
        const menuItems = await Menu.find({ sellerid: sellerId });
        const token = req.cookies.token;
        
        res.render('homestyle-menu', { 
            seller, 
            menuItems, 
            message: "",
            isAuthenticated: !!token 
        });
    } catch (error) {
        console.error('Error fetching seller:', error);
        res.status(500).send('Server error');
    }
});


router.post('/add-menu-item', verifyToken, async (req, res) => {
  try {
    const { day, price, description } = req.body;
    
    // Validate required fields
    if (!day || !price || !description) {
      return res.status(400).json({ 
        message: 'All fields (day, price, and description) are required'
      });
    }

    const sellerId = req.user.userId;

    // Check if a menu item already exists for the given day and seller
    let menuItem = await Menu.findOne({ day, sellerid: sellerId });

    if (menuItem) {
      // Update the existing menu item
      menuItem.price = price;
      menuItem.description = description;
      await menuItem.save();
      return res.status(200).json({ message: 'Menu item updated successfully' });
    } else {
      // Create a new menu item
      menuItem = new Menu({
        day,
        price,
        description,
        sellerid: sellerId
      });
      await menuItem.save();
      return res.status(201).json({ message: 'Menu item added successfully' });
    }
  } catch (error) {
    console.error('Error adding/updating menu item:', error);
    return res.status(500).json({ 
      message: 'Error adding menu item', 
      error: error.message 
    });
  }
});


// router.post('/add-menu-item', verifyToken, async (req, res) => {
//   console.log(req.user)
//   try {
//     const { day, price, description } = req.body;
//     console.log(day, price, description)

    
//     const newitem = await Menu.create({
//       price,
//       discription: description,
//       day,
//       sellerid: req.user.userId,
//     })

  
//     res.status(201).json({ message: 'Menu item added successfully' });
//   } catch (error) {
//     console.error('Error adding menu item:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });




router.get('/buy/:id', verifyToken, (req, res) => {
  const menuId = req.params.id;
  res.render('buyform', { menuId,message: '' });
  // res.render('homelystyle-menu',{message:"your order has been placed"});
});


router.post('/buy/:id', verifyToken, async (req, res) => {
  const menuId = req.params.id;
  try {
      // Log the received data
      console.log('Received order data:', req.body);
      
      const { preferredTime, paymentMethod, quantity } = req.body;
      const userId = req.user.userId; // From verifyToken middleware
      const menu = await Menu.findById(menuId);

      // Validate menuId
      if (!mongoose.Types.ObjectId.isValid(menuId)) {
          // res.render('homestyle-menu', {
          //     message: 'Invalid menu ID'
          // });
  res.render('buyform', { menuId ,message: 'Your order has been placed successfully!'});

      }

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
          // return res.render('homestyle-menu', {
          //     message: 'User not found'
          // });
  res.render('buyform', { menuId,message: 'User not found!' });

      }

      // Create a new order
      const newOrder = await Order.create({
          userId: userId,
          menuId: menuId,
          username: user.username,
          phone: user.phone,
          email: user.email,
          address: user.address,
          preferredTime: preferredTime,
          paymentMethod: paymentMethod,
          totalamount: menu.price * quantity,
          quantity: quantity,
          status: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
          orderDate: new Date()
      });

      // Handle response based on payment method
      if (paymentMethod === 'cod') {
        //   return res.render('homestyle-menu', {
        //       message: 'Your order has been placed successfully!'
        //   }
        // );
  res.render('buyform', { menuId,message: 'Your order has been placed successfully!' });
  
} else {
  // For online payment (redirect logic can be added later)
  // return res.render('index', {
  //   message: 'Redirecting to payment gateway'
  // });
  res.render('buyform', { menuId,message: 'Redirecting to payment gateway!' });
      }

  } catch (error) {
      console.error('Error creating order:', error);
      // return res.render('homelystyle-menu', {
      //     message: 'Error creating order: ' + error.message
      // });
  res.render('buyform', { menuId,message: 'Error creating order: !' });

  }
});



  router.post('/update-order-status/:id', async (req, res) => {
    try {
        const orderId = req.params.id; // Get the order ID from the URL parameter
        const { radio } = req.body; // Get the selected status value from the radio buttons

        // Check if the selected status is valid
        if (!radio || !['cancel', 'accept', 'delivered'].includes(radio)) {
            return res.status(400).json({ success: false, message: 'Invalid status selected' });
        }

        // Find the order by ID and update its status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update the status of the order
        order.status = radio;

        // Save the updated order
        await order.save();

        // Redirect to the previous page or send a success response
        res.redirect('/user/seller'); // You can adjust this URL as needed
        // Or send a success response
        // res.json({ success: true, message: 'Order status updated successfully' });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});




router.get('/users', async (req, res) => {
  const user = await userModel.find()
  console.log(user)
  res.render('users', { user })

})

router.post('/register', upload.single('image'),
  body('email').trim().isEmail(),
  body('password').trim().isLength({ min: 5 }),
  body('username').trim().isLength({ min: 3 }),
  body('phone').trim().isLength({ min: 10 }),
  body('address').trim(),



  async (req, res) => {
    const errors = validationResult(req)
    console.log(errors)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'invalid data'
      })
    }

    const { username, email, phone, address, password, userType, confirmpassword } = req.body
    console.log(username, email, password)
    if (userType == "user") {
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await userModel.create({
        username,
        email,
        phone,
        address,
        password: hashedPassword
      })
      res.render('login')
    }
    else {
      const hashedPassword = await bcrypt.hash(password, 10)

      const newseller = await Seller.create({
        username,
        email,
        phone,
        address,
        password: hashedPassword,
        image: req.file.filename
      })
      res.render('login')

    }

    // res.send(errors)
    console.log(req.body)
  })

router.get('/login', (req, res) => {
  res.render('login')
})
// router.post('/login',(req,res)=>{


//   console.log('loggin')

// })

router.post('/login',
  body('username').trim().isLength({ min: 3 }),
  body('password').trim().isLength({ min: 8 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array(),
          message: 'invalid data'
        });
      }

      const { username, password, role } = req.body;
      let user;

      // Check user based on role
      if (role === 'user') {
        user = await userModel.findOne({ username: username });

      } else if (role === 'tiffin_seller') {
        user = await Seller.findOne({ username: username });
      }

      // If no user found
      if (!user) {
        return res.status(400).json({
          message: 'Username or password is incorrect'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          message: 'Username or password is incorrect'
        });
      }

      // Create JWT token with role information
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
          role: role // Include role in token
        },
        process.env.JWT_SECRET
      );

      // Set cookie and redirect
      res.cookie('token', token);
      if (role === 'user') {
        console.log("loged in")
        res.redirect('/')

      }
      else {
        res.redirect('seller');
      }


    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({
        message: 'Server error during login',
        error: error.message
      });
    }
  }
);

router.get('/logout',async (req, res) => {
  res.clearCookie('token'); // Clear the token cookie
  res.redirect('/'); // Redirect to home page
});
router.get('/sellerlogout',async (req, res) => {
  console.log("sellerloggout")
  res.clearCookie('token'); // Clear the token cookie
  res.redirect('/user/seller'); // Redirect to home page
});

router.get('/myprofile', verifyToken, async (req, res) => {
  try {
    // Assuming req.user contains the user ID from the verifyToken middleware
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('myprofile', { user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).send('Server error');
  }
});

router.get('/editprofile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('editprofile', { user });
  } catch (error) {
    console.error('Error fetching user for edit profile:', error);
    res.status(500).send('Server error');
  }
});

router.post('/editprofile', verifyToken, async (req, res) => {
  try {
    const { username, email, phone, address } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.username = username;
    user.email = email;
    user.phone = phone;
    user.address = address;

    await user.save();

    res.redirect('/login');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send('Server error');
  }
});

router.get('/myorders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate('menuId')  // This will populate the menu information
      .sort({ date: -1 });
    res.render('myorders', { orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Server error');
  }
});


router.get("/forget-password",async(req,res)=>{
  res.render('forgetpass')
})



router.post("/forgot-password", async (req, res) => {
  try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(400).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour expiry

      await user.save();

      // Send email
      const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const resetLink = `http://localhost:3000/user/reset-password/${resetToken}`; // Correctly formatted URL

      const mailOptions = {
          to: user.email,
          subject: "Password Reset Request",
          html: `<p>Click <a href="${resetLink}">here to reset your password.</a></p>`, // Use backticks for template literals
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: "Password reset email sent" });

  } catch (error) {
      console.error('Error sending password reset email:', error); // Log the error for debugging
      res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
      const { token } = req.params;
      const {Password} = req.body;

      const user = await User.findOne({ 
          resetPasswordToken: token, 
          resetPasswordExpire: { $gt: Date.now() } 
      });
console.log(user)
      if (!user) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(Password, salt);

      // Clear reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      

      res.json({ message: "Password reset successful" });

  } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).send('Invalid or expired token');
    }

    res.render('reset-password', { token }); // Render a view to reset the password
});

router.get('/editsellerprofile', verifyToken, async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.userId);

    if (!seller) {
      return res.status(404).send('Seller not found');
    }

    res.render('editsellerprofile', { sellers: seller }); // Changed to match the template variable name
  } catch (error) {
    console.error('Error fetching seller for edit profile:', error);
    res.status(500).send('Server error');
  }
});

// Handle seller profile update
router.post('/editsellerprofile', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const sellerId = req.user.userId;

    const seller = await Seller.findById(sellerId);

    if (!seller) {
      return res.status(404).send('Seller not found');
    }

    // Update basic information
    seller.username = username;
    seller.email = email;
    seller.phone = phone;

    // Update image if a new one is uploaded
    if (req.file) {
      seller.image = req.file.filename;
    }

    await seller.save();

    // Redirect back to the profile page with success message
    res.redirect('/user/seller?message=Profile updated successfully');
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;


