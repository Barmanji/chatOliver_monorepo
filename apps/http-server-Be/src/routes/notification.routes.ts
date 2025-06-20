import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
} from "../controllers/notification.controller.js";

const router:Router = express.Router();
router.use(verifyJWT);

// Notification APIs
router.post("/", createNotification);
router.get("/", getUserNotifications);
router.put("/:notificationId/mark-read", markNotificationAsRead);
router.delete("/:notificationId", deleteNotification);
router.put("/mark-all-read", markAllNotificationsAsRead);
router.delete("/", clearAllNotifications);

export default router;
