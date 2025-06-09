import { CallLog } from "../models/calls/callLogs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCallLog = asyncHandler(async (req, res) => {
    const { receiver, callType, status } = req.body;
    const caller = req.user._id;

    if (!isValidObjectId(receiver)) {
        throw new ApiError(400, "Invalid receiver ID");
    }

    if (!["audio", "video"].includes(callType) || !["missed", "answered"].includes(status)) {
        throw new ApiError(400, "Invalid call type or status");
    }

    const log = await CallLog.create({ caller, receiver, callType, status });

    res.status(201).json(new ApiResponse(201, log, "Call log created"));
});

const getUserCallLogs = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const logs = await CallLog.find({
        $or: [{ caller: userId }, { receiver: userId }],
    })
    .populate("caller", "username profilePicture")
    .populate("receiver", "username profilePicture")
    .sort({ timestamp: -1 });

    res.status(200).json(new ApiResponse(200, logs));
});

const getCallLogById = asyncHandler(async (req, res) => {
    const { logId } = req.params;

    if (!isValidObjectId(logId)) throw new ApiError(400, "Invalid call log ID");

    const log = await CallLog.findById(logId)
        .populate("caller", "username profilePicture")
        .populate("receiver", "username profilePicture");

    if (!log) throw new ApiError(404, "Call log not found");

    res.status(200).json(new ApiResponse(200, log));
});

const deleteCallLog = asyncHandler(async (req, res) => {
    const { logId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(logId)) throw new ApiError(400, "Invalid call log ID");

    const log = await CallLog.findOne({
        _id: logId,
        $or: [{ caller: userId }, { receiver: userId }],
    });

    if (!log) throw new ApiError(404, "Call log not found or unauthorized");

    await CallLog.findByIdAndDelete(logId);

    res.status(200).json(new ApiResponse(200, null, "Call log deleted"));
});

export {
    createCallLog,
    getUserCallLogs,
    getCallLogById,
    deleteCallLog,
};
