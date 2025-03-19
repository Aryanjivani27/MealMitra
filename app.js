const express=require('express');
const app=express();
const userRouter=require('./routes/user.route')
const dotenv=require('dotenv')
dotenv.config();
const connectToDB=require('./config/db')
const cookieparser=require('cookie-parser')
const verifyToken = require('./middleware/auth.middleware');
const path =require('path');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const Seller = require('./models/seller.model')
const Order=require('./models/order.model')
const mongoose = require('mongoose');
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine",'ejs')


connectToDB();




// app.set('view engine','ejs')
app.use(cookieparser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
// app.use(csrfProtection);

app.get('/', async (req, res) => {
    const sellers = await Seller.find()
//   console.log(sellers)

    const token = req.cookies.token; // Get token from cookies
    res.render('index', { 
        isAuthenticated: !!token,
        sellers // Convert token to boolean
    });
});

app.use('/user',userRouter)
   

app.get('/protected-route', verifyToken, (req, res) => {
    res.send(`Welcome ${req.user.username}! You are authenticated.`);

   
   
});



// app.use((req, res) => {
//     res.status(404).render('404', { url: req.url });
// });

// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).render('error', { 
//         message: 'Something broke!',
//         error: process.env.NODE_ENV === 'development' ? err : {}
//     });
// });

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

app.listen(3000,()=>{
    console.log("server is running on port 3000")
})