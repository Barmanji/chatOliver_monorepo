import express, { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createCallLog,
    getUserCallLogs,
    getCallLogById,
    deleteCallLog,
} from "../controllers/callLog.controller.js";

const router:Router = express.Router();
router.use(verifyJWT);

// Routes
router.post("/", createCallLog);
router.get("/", getUserCallLogs);
router.get("/:logId", getCallLogById);
router.delete("/:logId", deleteCallLog);

export default router;
