import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { FriendRequest } from "../models/friends/friendRequest.model.js";
import { User } from "../models/user/user.model.js"; // Needed for adding to friends list

const sendFriendRequest = asyncHandler(async (req, res) => {
    const from = req.user._id;
    const { to } = req.body;

    if (!isValidObjectId(to)) throw new ApiError(400, "Invalid user ID");

    if (from.toString() === to) throw new ApiError(400, "Cannot send request to yourself");

    const existing = await FriendRequest.findOne({
        $or: [
            { from, to },
            { from: to, to: from }
        ],
    });

    if (existing) throw new ApiError(409, "Friend request already exists or pending");

    const request = await FriendRequest.create({ from, to });

    res.status(201).json(new ApiResponse(201, request, "Friend request sent"));
});

const getOutgoingRequests = asyncHandler(async (req, res) => {
    const from = req.user._id;

    const requests = await FriendRequest.find({ from })
        .populate("to", "username name profilePicture")
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, requests));
});

const getIncomingRequests = asyncHandler(async (req, res) => {
    const to = req.user._id;

    const requests = await FriendRequest.find({ to, status: "pending" })
        .populate("from", "username name profilePicture")
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, requests));
});

const cancelSentRequest = asyncHandler(async (req, res) => {
    const from = req.user._id;
    const { requestId } = req.params;

    if (!isValidObjectId(requestId)) throw new ApiError(400, "Invalid request ID");

    const request = await FriendRequest.findOne({ _id: requestId, from });
    if (!request) throw new ApiError(404, "Friend request not found");

    await request.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Friend request canceled"));
});

const acceptIncomingFriendRequest = asyncHandler(async (req, res) => {
    const to = req.user._id;
    const { requestId } = req.params;

    if (!isValidObjectId(requestId)) throw new ApiError(400, "Invalid request ID");

    const request = await FriendRequest.findOne({ _id: requestId, to, status: "pending" });
    if (!request) throw new ApiError(404, "No such friend request");

    request.status = "accepted";
    await request.save();

    // Add to both users' friend lists (assuming User model has a `friends` array)
    await User.findByIdAndUpdate(to, { $addToSet: { friends: request.from } });
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: to } });

    res.status(200).json(new ApiResponse(200, request, "Friend request accepted"));
});

const rejectIncomingFriendRequest = asyncHandler(async (req, res) => {
    const to = req.user._id;
    const { requestId } = req.params;

    if (!isValidObjectId(requestId)) throw new ApiError(400, "Invalid request ID");

    const request = await FriendRequest.findOne({ _id: requestId, to, status: "pending" });
    if (!request) throw new ApiError(404, "No such friend request");

    request.status = "rejected";
    await request.save();

    res.status(200).json(new ApiResponse(200, request, "Friend request rejected"));
});

export {
    sendFriendRequest,
    getOutgoingRequests,
    getIncomingRequests,
    cancelSentRequest,
    acceptIncomingFriendRequest,
    rejectIncomingFriendRequest,
};
