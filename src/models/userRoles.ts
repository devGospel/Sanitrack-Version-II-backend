import mongoose, { Document, Schema, model } from 'mongoose';
import User from './user';
import Role from './role';

interface UserRoles extends Document{ 
    user_id: mongoose.Types.ObjectId, 
    user_name: string,
    role_id: mongoose.Types.ObjectId, 
    role_name: string
}

const userRolesSchema = new Schema<UserRoles> ({ 
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true },
    user_name:{type: String, required: true}, 
    role_id: {type: mongoose.Schema.Types.ObjectId, ref: Role, require: true}, 
    role_name: {type: String, required: true}
})

const UserRoles = model<UserRoles>('userRoles', userRolesSchema)

export default UserRoles