import mongoose, { Document, model, Schema } from 'mongoose';
import User from './user';
import Role from './role';

interface LoginLogs extends Document{ 
    userId: mongoose.Types.ObjectId
    roleId: mongoose.Types.ObjectId
    logoutAt: Date
}

const loginSchema = new Schema<LoginLogs>({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true}, 
    roleId: {type: mongoose.Schema.Types.ObjectId, ref: Role, required: true},
    logoutAt: { type: Date } // Field to store the logout time
}, {
    timestamps: true
})

const LoginLogs = model('login_logs', loginSchema)

export default LoginLogs