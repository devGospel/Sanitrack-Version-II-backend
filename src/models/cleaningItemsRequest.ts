// this is the schema that is going handle them requesting cleaning item.
import mongoose, { Document, Schema } from 'mongoose';
import TaskModel from './task';
import RoomModel from './room';
import CleaningItems from './cleaningItems';

interface cleaningItemRequest extends Document{ 
    task_id: mongoose.Types.ObjectId,
    requested_items: [
        {
            _id: mongoose.Types.ObjectId,
            cleaning_id: mongoose.Types.ObjectId, 
            item_name: String, 
            quantity: Number, 
            unit: String, 
            cleaner_reason: String, 
            inspector_reason: String, 
            approved: Boolean, 
            completed: Boolean
        }
    ]
    all_approved: Boolean
}

const requestedCleaningItemsSchema = new Schema<cleaningItemRequest>({ 
    task_id: {type: mongoose.Schema.Types.ObjectId, ref: TaskModel, required: true}, 
    requested_items: [
        {
            cleaning_id: {type: mongoose.Schema.Types.ObjectId, ref: CleaningItems, required: true}, 
            item_name: {type: String, required: true}, 
            quantity: {type: Number}, 
            unit: {type: String}, 
            cleaner_reason: {type: String, required: true}, 
            inspector_reason: {type: String, default: "No comment", required: true}, 
            approved: {type: Boolean, default: false,  required: true}, 
            completed: {type: Boolean, default: false, required: true} //add completed to track whether he as done something related to the task or not
        }
    ],
    all_approved: {type: Boolean, default: false, required: true}
})

const RequestCleaningItems = mongoose.model<cleaningItemRequest>('requested_cleaning_items', requestedCleaningItemsSchema)

export default RequestCleaningItems