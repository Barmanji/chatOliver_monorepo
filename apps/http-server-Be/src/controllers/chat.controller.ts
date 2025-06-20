import mongoose, { isValidObjectId } from "mongoose";
import { Request, Response, RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat/chat.model.js";
import { Group } from "../models/group/group.model.js";
import { IUser } from "../models/user/user.model.js";

// Extend the Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

const createChat: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { participantIds, isGroupChat, groupId } = req.body;

    if (!Array.isArray(participantIds) || participantIds.length < 2) {
        throw new ApiError(400, "At least 2 participants are required");
    }

    const chat = await Chat.create({
        participants: participantIds,
        isGroupChat,
        groupId: isGroupChat ? groupId : null,
    });

    res.status(201).json(new ApiResponse(201, chat, "Chat created successfully"));
});

const getUserChats: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const chats = await Chat.find({ participants: userId })
        .populate("participants", "-password")
        .populate("groupId")
        .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, chats));
});

const getChatById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    if (!isValidObjectId(chatId)) {
        throw new ApiError(400, "Invalid chat ID");
    }

    const chat = await Chat.findById(chatId)
        .populate("participants", "-password")
        .populate("groupId");

    if (!chat) throw new ApiError(404, "Chat not found");

    res.status(200).json(new ApiResponse(200, chat));
});

const addUserToGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
        throw new ApiError(400, "Group chat not found");
    }

    if (chat.participants.includes(userId)) {
        throw new ApiError(400, "User already in the group");
    }

    chat.participants.push(userId);
    await chat.save();

    res.status(200).json(new ApiResponse(200, chat, "User added to group"));
});

const removeUserFromGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
        throw new ApiError(400, "Group chat not found");
    }

    chat.participants = chat.participants.filter((p: mongoose.Types.ObjectId) => p.toString() !== userId);
    await chat.save();

    res.status(200).json(new ApiResponse(200, chat, "User removed from group"));
});

const updateTypingStatus: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId, isTyping } = req.body;
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isAlreadyTyping = chat.typingUsers.includes(userId);

    if (isTyping && !isAlreadyTyping) {
        chat.typingUsers.push(userId);
    } else if (!isTyping && isAlreadyTyping) {
        chat.typingUsers = chat.typingUsers.filter((id: mongoose.Types.ObjectId) => id.toString() !== userId.toString());
    }

    await chat.save();
    res.status(200).json(new ApiResponse(200, null, "Typing status updated"));
});

const deleteChat: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params;

    const chat = await Chat.findByIdAndDelete(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    res.status(200).json(new ApiResponse(200, chat, "Chat deleted successfully"));
});

const createGroupChat: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, members, adminId } = req.body;

    if (!Array.isArray(members) || members.length < 2) {
        throw new ApiError(400, "A group must have at least 3 members");
    }

    // Assuming Group model and creation logic is elsewhere
    const group = await Group.create({ name, description, members, admin: adminId });

    const chat = await Chat.create({
        participants: members,
        isGroupChat: true,
        groupId: group._id,
    });

    res.status(201).json(new ApiResponse(201, chat, "Group chat created"));
});

export {
    createChat,
    getUserChats,
    getChatById,
    addUserToGroup,
    removeUserFromGroup,
    updateTypingStatus,
    deleteChat,
    createGroupChat,
};
