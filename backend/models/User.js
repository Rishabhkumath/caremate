const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:[true,'Please add a name'],
    trim:true,
    maxlength:[50,'Name cannot exceed 50 characters']
  },

  email:{
    type:String,
    required:[true,'Please add an email'],
    unique:true,
    lowercase:true,
    trim:true,
    match:[
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },

  passwordHash:{
    type:String,
    required:[true,'Please add a password'],
    minlength:[6,'Password must be at least 6 characters'],
    select:false
  },

  role:{
    type:String,
    enum:['patient','doctor','caregiver','admin'],
    default:'patient'
  },

  phoneNumber:{
    type:String,
    match:[/^[0-9]{10}$/,'Please add a valid 10-digit phone number']
  },

  profilePicture:{
    type:String,
    default:''
  },

  isActive:{
    type:Boolean,
    default:true
  },

  lastLogin:Date,

  passwordResetToken:String,
  passwordResetExpires:Date,

  createdAt:{
    type:Date,
    default:Date.now
  }

},{
  timestamps:true,
  toJSON:{virtuals:true},
  toObject:{virtuals:true}
})

userSchema.pre('save',async function(next){

  if(!this.isModified('passwordHash')){
    return next()
  }

  const salt = await bcrypt.genSalt(10)

  this.passwordHash = await bcrypt.hash(this.passwordHash,salt)

  next()

})

userSchema.methods.matchPassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword,this.passwordHash)
}

module.exports = mongoose.model('User',userSchema)