import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat/chat.model.js";

const createChat = asyncHandler(async (req, res) => {
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

const getUserChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const chats = await Chat.find({ participants: userId })
        .populate("participants", "-password")
        .populate("groupId")
        .sort({ updatedAt: -1 });

    res.status(200).json(new ApiResponse(200, chats));
});

const getChatById = asyncHandler(async (req, res) => {
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

const addUserToGroup = asyncHandler(async (req, res) => {
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

const removeUserFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
        throw new ApiError(400, "Group chat not found");
    }

    chat.participants = chat.participants.filter(p => p.toString() !== userId);
    await chat.save();

    res.status(200).json(new ApiResponse(200, chat, "User removed from group"));
});

const updateTypingStatus = asyncHandler(async (req, res) => {
    const { chatId, isTyping } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    const isAlreadyTyping = chat.typingUsers.includes(userId);

    if (isTyping && !isAlreadyTyping) {
        chat.typingUsers.push(userId);
    } else if (!isTyping && isAlreadyTyping) {
        chat.typingUsers = chat.typingUsers.filter(id => id.toString() !== userId.toString());
    }

    await chat.save();
    res.status(200).json(new ApiResponse(200, null, "Typing status updated"));
});

const deleteChat = asyncHandler(async (req, res) => {
    const { chatId } = req.params;

    const chat = await Chat.findByIdAndDelete(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    res.status(200).json(new ApiResponse(200, chat, "Chat deleted successfully"));
});

const createGroupChat = asyncHandler(async (req, res) => {
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
