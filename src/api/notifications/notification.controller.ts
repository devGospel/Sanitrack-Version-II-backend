import { Response } from "express";
import { Expo } from "expo-server-sdk";
import { AuthenticatedRequest } from "../../middlewares/security";
import User from "../../models/user";
import webpush from "web-push";
import dotenv from "dotenv";
import customResponse from "../../helpers/response"
import { createChildLogger } from "../../utils/childLogger";
import catchAsync from "../../utils/catchAsync";
import { unReadNotification } from "../../utils/notification";
import NotificationModel from "../../models/notification";

dotenv.config();
let expo = new Expo();

const moduleName = '[notification/controller]'
const Logger = createChildLogger(moduleName)
/**
 * Get push notifications token.
 * @param req - Express Request object
 * @param res - Express Response object
 * @returns Response with success or error message
 */

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error("VAPID keys are not defined in environment variables");
}

webpush.setVapidDetails(
  "mailto:offionfrancis14@gmail.com",
  vapidKeys.publicKey!,
  vapidKeys.privateKey!
);
const getNotificationsToken = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { token } = req.body;
  const userId = req.auth.userId;
  try {
    if(!token) return customResponse.badRequestResponse('Token is empty', res)
    const response = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { notificationToken: token } },
      { new: true }
    );
    const updatedUser = await User.findById(userId);
    // Logger.info("Updated User", updatedUser);

    res.status(200).send("Success");
  } catch (error) {
    res.status(500).send("Error getting push notification token");
  }
};

/**
 * Send a push notification to a specific Expo push token.
 * @param token - Expo push notification token.
 * @param title - Notification title.
 * @param body - Notification body.
 */

const sendNotification = async (
  token: string | undefined,
  title: string,
  body: string
) => {
  if (!Expo.isExpoPushToken(token)) {
    Logger.error(`Push token ${token} is not a valid Expo push token`);
    throw new Error("Invalid Expo push token");
  }
  try {
    const messages = [
      {
        to: token,
        title,
        body,
      },
    ];

    let ticketChunk = await expo.sendPushNotificationsAsync(messages);
    // Logger.info("Notification ticket:", ticketChunk);
    return ticketChunk;
  } catch (error) {
    Logger.error("Error sending notification:", error);
    throw error; // Re-throw to handle it on a higher level (e.g., HTTP response)
  }
};

const saveWebPushNotificationSubscription = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const subscription = req.body;
  const userId = req.auth.userId;
  // Logger.info("Saving notification subscription", subscription);
  try {
    const response = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { webPushSubscription: subscription } },
      { new: true }
    );
    if(!response) return customResponse.badRequestResponse('There is no user with such subscription', res)
    // Logger.info("New web push subscription", response);
    res.status(200).send("Subscription saved.");
  } catch (error) {
    Logger.error(error)
    res.status(500).send("Failed to save subscription.");
  }
};

const sendWebNotification = async (
  userId: string,
  title: string,
  body: string
) => {
  try {
    const user = await User.findById(userId);
    // Check if user and webPushSubscription exist
    if (!user || !user.webPushSubscription) {
      console.log("No subscription found for this user.");
      return; // Exit the function if no subscription is found
    }
    const subscription = user.webPushSubscription;
    const payload = JSON.stringify({ title, body });

    // You can now safely send the notification
    const response = await webpush.sendNotification(subscription, payload);
    // Logger.info("Notification sent", response);
  } catch (error) {
    Logger.error("Error sending web notification:", error);
    throw error; // Re-throw the error to handle it in the calling context
  }
};

const topNotifications = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
  // get the top notifications for th logged in user
  const userId = req.auth.userId
  const result = await unReadNotification(userId)
  return customResponse.successResponse('fetched notifications', result, res)
})

const allNotifications = catchAsync(async (req:AuthenticatedRequest, res:Response) => { 
  const userId = req.auth.userId
  const result = await NotificationModel.findOne({receiver: userId}).populate('messages.sender messages.workOrderId')
  return customResponse.successResponse("all notifications", result, res)

})

const markAsRead = catchAsync(async(req:AuthenticatedRequest, res:Response) => { 
  const userId = req.auth.userId
  const {notificationIds} = req.body
  await Promise.all(notificationIds.map(async(notifications: any) => { 
    // update all the notifications with that id to read 
    await NotificationModel.updateOne(
      {
        _id: notifications,
        "messages.isRead": false,
        receiver: userId
      },
      {
        $set: { "messages.$[].isRead": true }  // Update all messages in the array
      }
    );
  }))
  return customResponse.successResponse('Updated notifications', [], res)
})
export default {
  getNotificationsToken,
  sendNotification,
  saveWebPushNotificationSubscription,
  sendWebNotification,
  topNotifications,
  allNotifications, 
  markAsRead
};
