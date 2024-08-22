import mongoose, { Document, Schema } from "mongoose";
import Address from "./address";
import bcrypt from 'bcryptjs';

// Add a new interface for the web push subscription
interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Extend the User interface with the webPushSubscription property
interface User extends Document {
  username: string;
  password: string;
  email: string;
  address_id: mongoose.Types.ObjectId;
  phone_number: string;
  flag: string;
  otp_code: string;
  otp_expiry_time: Date;
  notificationToken: string;
  webPushSubscription?: WebPushSubscription; // Make it optional if not all users will have it set
}

// Update the userSchema to include the new webPushSubscription field
const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true, select: false },
  email: { type: String, required: true , unique: true}, 
  address_id: { type: mongoose.Types.ObjectId, ref: Address, required: true }, 
  phone_number: { type: String, required: true },
  flag: { type: String, default: 'ACTIVE' }, 
  otp_code: { type: String }, 
  otp_expiry_time: { type: Date },
  notificationToken: { type: String, require: false, default: '' },
  webPushSubscription: {
    type: {
      endpoint: { type: String, required: false },
      keys: {
        p256dh: { type: String, required: false },
        auth: { type: String, required: false }
      },
    },
    required: false
  },
})

// Pre-save hook to hash the password
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();

  try {
    user.password = await bcrypt.hash(user.password, 12);
    next();
  } catch (err:any) {
    console.log('Something happened while encrypting user password')
    next(err);
  }
});

const User = mongoose.model<User>("User", userSchema);

export default User;
