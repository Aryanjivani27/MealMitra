
const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    username:{
    type:String,
    required:true,
    trim:true,
    // unique:true,
    Minlength:[3,"username must be at least 3 characters long"],

},

address:{
    type:String,
    trim:true,
    required:true,
},

phone:{
    type:String,
    required:true,
},

    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true,
        minlength:[5,"email must be at least 5 characters long"],
    },

    password:{
        type:String,
        required:true,
        // trim:true,
        minlength:[5,"password must be at least 5 characters long"],
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpire: {
        type: Date,
        default: null,
    },
}, { timestamps: true }); 
    


exports.userSchema = userSchema

const User=mongoose.model('User',userSchema)

module.exports=User