import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    sendMessage,
    getMessages,
    markAsSeen,
    markAsDelivered,
    deleteMessage,
    editMessage,
    getLastMessage,
} from "../controllers/message.controller.js";

const router:Router = express.Router();

router.use(verifyJWT);

router.route("/send").post(sendMessage);
router.route("/chat/:chatId").get(getMessages);
router.route("/last/:chatId").get(getLastMessage);

router.route("/:messageId")
    .delete(deleteMessage)
    .put(editMessage); // edit message

router.route("/:messageId/seen").put(markAsSeen);
router.route("/:messageId/delivered").put(markAsDelivered);

export default router;
