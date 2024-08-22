import mongoose from "mongoose";
import NotificationModel from "../models/notification";
import { getCurrentDateInLosAngeles } from "./date";

//create the message to send 
export const createMessage = (roomName: String | undefined, workOrderId? : mongoose.Types.ObjectId) => { 
    return `You have been assigned a work order in ${roomName} please check your tasks`
}


// get user top 5 unread notification 
export const unReadNotification = async (userId: mongoose.Types.ObjectId) => { 
   return await NotificationModel.findOne({receiver: userId})
    .select('messages')
    .where('messages.isRead')
    .equals(false)
    .sort({ 'messages.dateAdded': -1 })
    .limit(5);
}

// Function to create and store a notification
export const sendNotification =  async(userId: mongoose.Types.ObjectId , senderId:mongoose.Types.ObjectId, workOrderId: mongoose.Types.ObjectId, message: String) =>  {
    await NotificationModel.updateOne(
      { receiver: userId },
      {
        $push: {
          messages: {
            sender: senderId,
            workOrderId: workOrderId,
            message: message,
            dateAdded: getCurrentDateInLosAngeles(),
            isRead: false
          }
        }
      },
      { upsert: true } // Create the document if it doesn't exist
    );
  }
  