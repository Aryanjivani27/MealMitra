
const mongoose=require('mongoose')

const menuSchema=new mongoose.Schema({
    price:{
    type:Number,
    required:true,
    trim:true,
    // unique:true,
    Minlength:[2,"username must be at least 3 characters long"],

},

    description:{
        type: String,
        required:true,
        trim:true,
        // unique:true,
        lowercase:true,
        minlength:[3,"description must be at least 5 characters long"],
    },

    day: {
        type: String,
        required: true,
        // enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        lowercase: true},
   
    sellerid:{

        type:mongoose.Schema.Types.ObjectId,
        ref:"Seller",
        required: true,
    },


    // password:{
    //     type:String,
    //     required:true,
    //     trim:true,
    //     minlength:[5,"password must be at least 5 characters long"],
    // },
    

})
exports.menuSchema = menuSchema

const Menu=mongoose.model('Menu',menuSchema)

module.exports=Menu