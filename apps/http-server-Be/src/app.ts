import express, {Express}  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();
app.use(
    cors({
        origin: process.env.ORIGIN_KEY_CORS,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" })); // to parse json data for api requests
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to parse urlencoded data for form submissions
app.use(express.static("public")); // in case of serving static files
app.use(cookieParser()); // populate req.cookies with cookies from the request headers

// route imports
import userRouter from "./routes/user.routes.js";
import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js";
import groupRouter from "./routes/group.routes.js";
import friendRequestRouter from  "./routes/friend-request.routes.js"
import notificationRouter from "./routes/notification.routes.js";
import callLogRouter from "./routes/callLog.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";

// route declarations
app.use("/api/v1/user", userRouter);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/friend-requests", friendRequestRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/call-logs", callLogRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

export { app };
