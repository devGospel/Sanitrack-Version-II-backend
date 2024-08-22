import mongoose, { Document, Schema } from 'mongoose';

interface Role extends Document {
    role_name: string;
}

const roleSchema = new Schema({
    role_name: { type: String, unique: true,  required: true },
});

const Role = mongoose.model<Role>('role', roleSchema);

export default Role;