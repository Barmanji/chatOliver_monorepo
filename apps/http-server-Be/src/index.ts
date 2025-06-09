import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import { Server } from "socket.io";
import { createServer } from "http";

dotenv.config({ path: "./env" });
console.log(process.env);
const server = createServer(app);
connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(`error in connection DB`, err);
    });

// Attach Socket.IO to the server
const io = new Server(server, {
    cors: {
        origin: "*", // your React frontend URL in prod
        methods: ["GET", "POST"],
    },
});

// Handle Socket.IO connections
const users = new Map(); // socket.id -> userId

io.on("connection", (socket) => {
    console.log("🔌 A user connected");

    socket.on("setup", (userId) => {
        users.set(socket.id, userId);
        socket.join(userId); // join room = userId
        console.log(`User ${userId} connected`);
    });

    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
    });

    socket.on("typing", (chatId) => {
        socket.in(chatId).emit("typing", users.get(socket.id));
    });

    socket.on("stop typing", (chatId) => {
        socket.in(chatId).emit("stop typing", users.get(socket.id));
    });

    socket.on("new message", (newMessage) => {
        const chat = newMessage.chatId;

        if (!chat) return;

        // emit to all users in the chat except sender
        socket.to(chat).emit("message received", newMessage);
    });

    socket.on("disconnect", () => {
        const userId = users.get(socket.id);
        users.delete(socket.id);
        console.log(`❌ User ${userId} disconnected`);
    });
});
// i tried but its giving unaccesiblity error FFS
// const Env = {
//     mongoDb_URI: process.env.MONGODB_URI,
//     accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
//     accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
//     refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
//     refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
//     cloudinarySecret: process.env.CLOUDNARY_APISECRET,
//     cloudinaryApiKey: process.env.CLOUDINARY_APIKEY,
//     cloudinaryCloudName: process.env.CLOUDINARY_CLOUDNAME,
// }
