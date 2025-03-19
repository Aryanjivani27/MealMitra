const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    console.log('hello')
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).redirect('/user/login');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).redirect('/user/login');
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        return res.status(401).redirect('/user/login');
    }
};

module.exports = verifyToken; 