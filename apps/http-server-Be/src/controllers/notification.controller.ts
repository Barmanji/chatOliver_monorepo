import { Notification } from '../models/notifications/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose, { isValidObjectId } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';

const createNotification = asyncHandler(async (req, res) => {
    const { userId, type, data } = req.body;

    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const notification = await Notification.create({
        userId,
        type,
        data,
    });

    res.status(201).json(new ApiResponse(201, notification, "Notification created"));
});

const getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, notifications));
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationId } = req.params;

    if (!isValidObjectId(notificationId)) throw new ApiError(400, "Invalid notification ID");

    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { $set: { readStatus: true } },
        { new: true }
    );

    if (!notification) throw new ApiError(404, "Notification not found");

    res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

const deleteNotification = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { notificationId } = req.params;

    if (!isValidObjectId(notificationId)) throw new ApiError(400, "Invalid notification ID");

    const result = await Notification.findOneAndDelete({ _id: notificationId, userId });

    if (!result) throw new ApiError(404, "Notification not found or already deleted");

    res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany({ userId, readStatus: false }, { $set: { readStatus: true } });

    res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

const clearAllNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.deleteMany({ userId });

    res.status(200).json(new ApiResponse(200, null, "All notifications cleared"));
});

export {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
};
