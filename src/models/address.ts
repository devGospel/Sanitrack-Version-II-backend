import mongoose, { Document, Schema } from 'mongoose';

interface Address extends Document {
    country: string; 
    state: string; 
    city: string; 
    home_address: string
}

const addressSchema = new Schema({
    country: { type: String, required: true },
    state: { type: String, required: true},
    city: {type: String, require: true}, 
    home_address: {type: String, require: true}, 
});

const Address = mongoose.model<Address>('address', addressSchema);

export default Address;