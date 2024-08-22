import mongoose, { Document, Schema, model } from 'mongoose';
import User from './user';
import UserRoles from './userRoles';
import Permission from './permissions';
import Role from './role';



interface RolePermissions extends Document{ 
    role_id: mongoose.Types.ObjectId 
    permissions: Array<{ permission_id: mongoose.Types.ObjectId, permission_name: string }>;
}

const rolePermissionSchema = new Schema<RolePermissions> ({ 
    role_id: {type:mongoose.Schema.Types.ObjectId,ref: Role, require: true },
    permissions: [
        {
            permission_id: { type: mongoose.Schema.Types.ObjectId, ref: Permission, required: true },
            permission_name: String
        }
    ]
})

const RolePermissions = model<RolePermissions>('rolePermissions', rolePermissionSchema)

export default RolePermissions