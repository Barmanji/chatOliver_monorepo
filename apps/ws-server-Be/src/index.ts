import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config({ path: "./.env" });

const rooms: Record<string, WebSocket[]> = {};
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = new WebSocketServer({ port });

console.log(`WebSocket server running on ws://localhost:${port}`);

server.on("connection", (ws) => {

});
