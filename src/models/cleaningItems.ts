// This is every cleaning item in the database . Modified by the admin only 
import mongoose, { Document, Schema } from 'mongoose';
import Location from './location';

interface cleaningItems extends Document{ 
    equipment: String,
    description: String,
    quantity: Number, 
    type: String, //consumable [gloves etc], tools, detergents these are the types when it comes to cleaning Items
    pairs: Boolean,
    unit: String, 
    image: String,
    location_id: mongoose.Types.ObjectId, 
}

const cleaningItemsSchema = new Schema<cleaningItems>({ 
    equipment: {type: String, required: true}, 
    description:  {type: String, required: true}, 
    quantity:  {type: Number, required: true}, 
    type: {type:String, required: true},
    pairs: {type: Boolean, default: false},
    unit: {type: String, default: 'number', required: true},
    image: {type: String, default: 'https://th.bing.com/th/id/R.0bcc64ae37b79dcd1fe716ab39fb131d?rik=ZTUZwB6EbIrJYA&pid=ImgRaw&r=0'},
    location_id: {type: mongoose.Schema.Types.ObjectId, ref: Location, required: false}, 
})

const CleaningItems = mongoose.model<cleaningItems>('cleaning_items', cleaningItemsSchema);

export default CleaningItems;