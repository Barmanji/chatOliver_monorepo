import mongoose, { isValidObjectId } from "mongoose";
import { Group } from "../models/group/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response, RequestHandler } from "express";

const createGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, members } = req.body;
    const admin = req.user?._id;

    if (!admin) throw new ApiError(401, "User not authenticated");
    if (!name) throw new ApiError(400, "Group name is required");

    const group = await Group.create({
        name,
        description,
        admin,
        members: [...(members || []), admin],
    });

    res.status(201).json(new ApiResponse(201, group, "Group created"));
});

const updateGroupInfo: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");
    if (!isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the group admin can update group info");
    }

    group.name = name || group.name;
    group.description = description || group.description;

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Group info updated"));
});

const deleteGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the admin can delete the group");
    }

    await group.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Group deleted"));
});

const addMembersToGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");
    if (!Array.isArray(memberId) || memberId.length === 0) {
        throw new ApiError(400, "Members must be a non-empty array");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the admin can add members");
    }

    const uniqueMembers = memberId.filter((m) => !group.members.includes(m));

    group.members.push(...uniqueMembers);
    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Members added"));
});

const removeMembersFromGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { members } = req.body;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");
    if (!Array.isArray(members) || members.length === 0) {
        throw new ApiError(400, "Members must be a non-empty array");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "Only the admin can remove members");
    }

    group.members = group.members.filter(
        (m: mongoose.Types.ObjectId) => !members.includes(m.toString())
    );

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Members removed"));
});

const getGroupById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("admin", "username name")
        .populate("members", "username name");

    if (!group) throw new ApiError(404, "Group not found");

    res.status(200).json(new ApiResponse(200, group));
});

const getUserGroups: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "User not authenticated");

    const groups = await Group.find({ members: userId })
        .populate("admin", "username name")
        .populate("members", "username name");

    res.status(200).json(new ApiResponse(200, groups));
});

const leaveGroup: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "User not authenticated");

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() === userId.toString()) {
        throw new ApiError(
            403,
            "Admin cannot leave the group. Transfer admin first."
        );
    }

    group.members = group.members.filter(
        (m: mongoose.Types.ObjectId) => m.toString() !== userId.toString()
    );

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Left the group"));
});

const getGroupMembers: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
        "members",
        "username name"
    );

    if (!group) throw new ApiError(404, "Group not found");

    res.status(200).json(new ApiResponse(200, group.members));
});

export {
    createGroup,
    updateGroupInfo,
    deleteGroup,
    addMembersToGroup,
    removeMembersFromGroup,
    getGroupById,
    getUserGroups,
    leaveGroup,
    getGroupMembers,
};
