import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createChat,
    getUserChats,
    getChatById,
    addUserToGroup,
    removeUserFromGroup,
    updateTypingStatus,
    deleteChat,
    createGroupChat
} from "../controllers/chat.controller.js";

const router = express.Router();

// Protected routes only
router.use(verifyJWT);

// Routes
router.route("/").post(createChat).get(getUserChats); // POST = create chat, GET = get user's chats

router.route("/:chatId").get(getChatById).delete(deleteChat);

// feels illegal
// router.route("/group/add-user").put(addUserToGroup);
// router.route("/group/remove-user").put(removeUserFromGroup);
// router.route("/group").post(createGroupChat); // create group chat

router.route("/typing").put(updateTypingStatus);


export default router;
