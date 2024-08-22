import { Router } from "express"
import notifications from "./notification.controller";

export default () => {
    const notificationRouter = Router()

    notificationRouter.post('/get-token', notifications.getNotificationsToken)

    notificationRouter.post('/subscribe-to-push-notifications', notifications.saveWebPushNotificationSubscription)
    // notificationRouter.post('/send-notification', notifications.sendNotification)

    notificationRouter.get('/top-notifications', notifications.topNotifications)
    notificationRouter.get('/notifications', notifications.allNotifications)
    notificationRouter.patch('/read', notifications.markAsRead)
    
    return notificationRouter
}