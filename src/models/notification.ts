import mongoose, { model, Schema } from "mongoose"
import User from "./user";
import { getCurrentDateInLosAngeles } from "../utils/date";
import WorkOrderModel from "./workorder";

interface Notification extends Document { 
    receiver: mongoose.Types.ObjectId, 
    messages: {
    sender: mongoose.Types.ObjectId; 
    message: string;                  
    dateAdded: Date;                  
    isRead: boolean;                  
    }[];
}

const notificationSchema = new Schema({ 
    receiver: { type: mongoose.Types.ObjectId, ref: User, required: true },
    messages: [{
        workOrderId: {type: mongoose.Types.ObjectId, ref: WorkOrderModel, required: false},
        sender: { type: mongoose.Types.ObjectId, ref: User, required: true },
        message: { type: String, required: true },
        dateAdded: { type: Date, default: getCurrentDateInLosAngeles() },
        isRead: { type: Boolean, default: false },  // Each message has its own read status
    }]
})

const NotificationModel = model<Notification>('notification', notificationSchema)

export default NotificationModel