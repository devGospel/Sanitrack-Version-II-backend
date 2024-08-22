import mongoose, { Document, Schema, model } from 'mongoose';

interface ProtectiveElement extends Document {
    name: string;
    description?: string, 
    quantity: Number, 
    pairs: Boolean
}

const protectiveElementSchema = new Schema<ProtectiveElement>({ 
    name: {type: String, unique: true, required: true}, 
    description: {type: String, default: null, required: false}, 
    quantity: {type: Number, required: true}, 
    pairs: {type: Boolean, default: false}
})

const protectiveElementModel = model<ProtectiveElement>('protective_element', protectiveElementSchema)

export default protectiveElementModel