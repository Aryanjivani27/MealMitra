const mongoose=require('mongoose')

const orderSchema=new mongoose.Schema({


    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true,
        
    },

    menuId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Menu",
        required:true,
    },

    quantity:{
        type:Number,
        required:true,
    },
    totalamount:{
        type:Number,
        required:true,
    },
    username:{
        type:String,
        required:true,
        trim:true,
        
        Minlength:[3,"username must be at least 3 characters long"],
    
    },
    phone:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        // trim:true,
        // unique:true,
        // lowercase:true,
        // minlength:[5,"email must be at least 5 characters long"],
    },
    address: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true
    },
    preferredTime: {
        type: String,
        required: true
    },
    date:{
        type:Date,
        default:Date.now()

    },

})
exports.orderSchema = orderSchema

const Order=mongoose.model('Order',orderSchema)

module.exports=Order