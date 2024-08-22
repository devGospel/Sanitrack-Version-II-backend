// This is every cleaning item in the database . Modified by the admin only 
import mongoose, { Document, Schema } from 'mongoose';
import RoomModel from './room';
import TaskModel from './task';
import CleaningItems from './cleaningItems';
import User from './user';

interface roomCleaningItems extends Document{ 
    task_id: mongoose.Types.ObjectId, 
    room_id: mongoose.Types.ObjectId, 
    cleaning_items: [{ 
        cleaning_id: mongoose.Types.ObjectId, 
        item_name: String, 
        quantity: Number, 
        unit: String

        cleaner_cleaning_items: [{
            cleaner_id: mongoose.Types.ObjectId
            quantity_assigned: Number
        }]
    }], 
}

const roomCleaningItemsSchema = new Schema<roomCleaningItems>({ 
    task_id: {type: mongoose.Schema.Types.ObjectId, ref: TaskModel, required:true}, 
    room_id: {type: mongoose.Schema.Types.ObjectId, ref: RoomModel, required:true},
    cleaning_items: [{
        cleaning_id: {type: mongoose.Schema.Types.ObjectId, ref: CleaningItems, required:true}, 
        item_name: {type: String, required: true}, 
        quantity: {type: Number, required: true}, 
        unit: {type: String, required: true}, 

        cleaner_cleaning_items: [{ 
            cleaner_id: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true},
            quantity_assigned: {type: Number, default: 0, required: true}
        }]
    }]
})

const RoomCleaningItems = mongoose.model<roomCleaningItems>('room_cleaning_items', roomCleaningItemsSchema);

export default RoomCleaningItems;