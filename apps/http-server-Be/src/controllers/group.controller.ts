import mongoose, { isValidObjectId } from "mongoose";
import { Group } from "../models/group/group.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createGroup = asyncHandler(async (req, res) => {
    const { name, description, members } = req.body;
    const admin = req.user._id;

    if (!name) throw new ApiError(400, "Group name is required");

    const group = await Group.create({
        name,
        description,
        admin,
        members: [...(members || []), admin],
    });

    res.status(201).json(new ApiResponse(201, group, "Group created"));
});

const updateGroupInfo = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(groupId)) throw new ApiError(400, "Invalid group ID");

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the group admin can update group info");
    }

    group.name = name || group.name;
    group.description = description || group.description;

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Group info updated"));
});

const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the admin can delete the group");
    }

    await group.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Group deleted"));
});

const addMembersToGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { memberId } = req.body;

    if (!Array.isArray(memberId) || memberId.length === 0) {
        throw new ApiError(400, "Members must be a non-empty array");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the admin can add members");
    }

    const uniqueMembers = memberId.filter((m) => !group.members.includes(m));

    group.members.push(...uniqueMembers);
    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Members added"));
});

const removeMembersFromGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
        throw new ApiError(400, "Members must be a non-empty array");
    }

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the admin can remove members");
    }

    group.members = group.members.filter(
        (m) => !members.includes(m.toString())
    );

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Members removed"));
});

const getGroupById = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("admin", "username name")
        .populate("members", "username name");

    if (!group) throw new ApiError(404, "Group not found");

    res.status(200).json(new ApiResponse(200, group));
});

const getUserGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({ members: req.user._id })
        .populate("admin", "username name")
        .populate("members", "username name");

    res.status(200).json(new ApiResponse(200, groups));
});

const leaveGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) throw new ApiError(404, "Group not found");

    if (group.admin.toString() === req.user._id.toString()) {
        throw new ApiError(
            403,
            "Admin cannot leave the group. Transfer admin first."
        );
    }

    group.members = group.members.filter(
        (m) => m.toString() !== req.user._id.toString()
    );

    await group.save();

    res.status(200).json(new ApiResponse(200, group, "Left the group"));
});

const getGroupMembers = asyncHandler(async (req, res) => {
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
