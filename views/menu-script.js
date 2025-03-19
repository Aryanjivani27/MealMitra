document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-btn');
    const categoryContents = document.querySelectorAll('.category-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            categoryContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const category = tab.getAttribute('data-category');
            document.getElementById(`${category}-content`).classList.add('active');
        });
    });

    // Shopping cart functionality
    const cart = {
        items: [],
        total: 0
    };

    // Add to cart functionality
    const orderButtons = document.querySelectorAll('.order-btn');
    orderButtons.forEach(button => {
        button.addEventListener('click', () => {
            const menuItem = button.closest('.menu-item');
            const itemName = menuItem.querySelector('h3').textContent;
            const itemPrice = parseInt(menuItem.querySelector('.price').textContent.replace('₹', ''));
            
            addToCart(itemName, itemPrice);
            updateCartDisplay();
        });
    });

    function addToCart(name, price) {
        cart.items.push({ name, price });
        cart.total += price;
        showNotification(`Added ${name} to cart`);
    }

    function updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        cartItems.innerHTML = cart.items.map(item => `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>₹${item.price}</span>
            </div>
        `).join('');
        
        cartTotal.textContent = `₹${cart.total}`;
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Checkout functionality
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        if (cart.items.length > 0) {
            alert('Thank you for your order! Proceeding to checkout...');
            // Add checkout logic here
        } else {
            alert('Your cart is empty!');
        }
    });

    // Day Menu Modal Functionality
    const dayMenus = document.querySelectorAll('.day-menu');
    const modal = document.getElementById('dayMenuModal');
    const closeModal = document.querySelector('.close-modal');
    
    // Menu data structure
    const menuData = {
        Mon: {
            title: "Monday's Special",
            meal: "Matar Paneer",
            image: "https://images.unsplash.com/photo-1567337710282-00832b415979?q=80",
            description: "Fresh green peas and paneer in a rich tomato gravy, served with dal, rice, and rotis"
        },
        Tue: {
            title: "Tuesday's Special",
            meal: "Palak Paneer",
            image: "https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?q=80",
            description: "Creamy spinach curry with paneer, served with dal, rice, and rotis"
        },
        Wed: {
            title: "Wednesday's Special",
            meal: "Aloo Gobi",
            image: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?q=80",
            description: "Potato and cauliflower curry, served with dal, rice, and rotis"
        },
        Thu: {
            title: "Thursday's Special",
            meal: "Dal Tadka",
            image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80",
            description: "Yellow lentils tempered with cumin and garlic, served with rice and rotis"
        },
        Fri: {
            title: "Friday's Special",
            meal: "Mix Veg",
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80",
            description: "Mixed vegetable curry, served with dal, rice, and rotis"
        }
    };

    dayMenus.forEach(dayMenu => {
        dayMenu.addEventListener('click', () => {
            const day = dayMenu.querySelector('h4').textContent;
            const menuInfo = menuData[day];
            
            // Update modal content
            document.getElementById('modalDayTitle').textContent = menuInfo.title;
            document.getElementById('modalMealName').textContent = menuInfo.meal;
            document.getElementById('modalMealImage').src = menuInfo.image;
            document.getElementById('modalMealDescription').textContent = menuInfo.description;
            
            // Show modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close modal functionality
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Buy Now button functionality
    document.querySelector('.buy-now-btn').addEventListener('click', () => {
        const mealName = document.getElementById('modalMealName').textContent;
        alert(`Thank you for ordering ${mealName}! Your order is being processed.`);
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}); 