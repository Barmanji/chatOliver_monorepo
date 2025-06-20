import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    sendFriendRequest,
    getOutgoingRequests,
    getIncomingRequests,
    cancelSentRequest,
    acceptIncomingFriendRequest,
    rejectIncomingFriendRequest,
} from "../controllers/friendRequest.controller.js";

const router: Router = express.Router();
router.use(verifyJWT);

// Friend Request APIs
router.post("/send", sendFriendRequest);
router.get("/outgoing", getOutgoingRequests);
router.get("/incoming", getIncomingRequests);
router.delete("/cancel/:requestId", cancelSentRequest);
router.put("/accept/:requestId", acceptIncomingFriendRequest);
router.put("/reject/:requestId", rejectIncomingFriendRequest);

export default router;
