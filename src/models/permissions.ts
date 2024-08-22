import mongoose, { Document, Schema } from 'mongoose';

interface Permission extends Document {
    permission_name: string;
}

const permissionSchema = new Schema({
    permission_name: { type: String, unique: true,  required: true },
});

const Permission = mongoose.model<Permission>('permission', permissionSchema);

export default Permission;