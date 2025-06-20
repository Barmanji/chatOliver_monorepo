import mongoose, { isValidObjectId } from "mongoose";
import { Message } from "../models/chat/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat/chat.model.js";
import { Request, Response, RequestHandler } from "express";

const sendMessage: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, content, messageType } = req.body;
    const senderId = req.user?._id;

    if (!senderId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!chatId || !content || !messageType) {
        throw new ApiError(
            400,
            "chatId, content, and messageType are required"
        );
    }

    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid chat ID");
    }

    const message = await Message.create({
        chatId,
        senderId,
        content,
        messageType,
    });

    res.status(201).json(new ApiResponse(201, message, "Message sent"));
});

const getMessages: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid chat ID");
    }

    const messages = await Message.find({ chatId })
        .populate("senderId", "username name profilePicture")
        .sort({ createdAt: 1 });

    res.status(200).json(new ApiResponse(200, messages));
});

const markAsSeen: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    message.seen = true;
    await message.save();

    res.status(200).json(new ApiResponse(200, message, "Marked as seen"));
});

const markAsDelivered: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;

    if (!isValidObjectId(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    message.delivered = true;
    await message.save();

    res.status(200).json(new ApiResponse(200, message, "Marked as delivered"));
});

const deleteMessage: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!isValidObjectId(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    if (message.senderId.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the sender can delete this message");
    }

    await message.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Message deleted"));
});

const editMessage: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    if (!isValidObjectId(messageId)) {
        throw new ApiError(400, "Invalid message ID");
    }

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    if (message.senderId.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the sender can edit this message");
    }

    message.content = content;
    await message.save();

    res.status(200).json(new ApiResponse(200, message, "Message edited"));
});

const getLastMessage: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid chat ID");
    }

    const lastMessage = await Message.findOne({ chatId })
        .sort({ createdAt: -1 })
        .populate("senderId", "username name");

    if (!lastMessage) {
        throw new ApiError(404, "No messages found");
    }

    res.status(200).json(new ApiResponse(200, lastMessage));
});

export {
    sendMessage,
    getMessages,
    markAsSeen,
    markAsDelivered,
    deleteMessage,
    editMessage,
    getLastMessage,
};
