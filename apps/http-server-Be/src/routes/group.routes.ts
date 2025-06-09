import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createGroup,
    updateGroupInfo,
    deleteGroup,
    addMembersToGroup,
    removeMembersFromGroup,
    getGroupById,
    getUserGroups,
    leaveGroup,
    getGroupMembers,
} from "../controllers/group.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/")
    .post(createGroup)
    .get(getUserGroups);

router.route("/:groupId")
    .get(getGroupById)
    .put(updateGroupInfo)
    .delete(deleteGroup);

router.route("/:groupId/add-members")
    .put(addMembersToGroup);

router.route("/:groupId/remove-members")
    .put(removeMembersFromGroup);

router.route("/:groupId/leave")
    .put(leaveGroup);

router.route("/:groupId/members")
    .get(getGroupMembers);

export default router;
