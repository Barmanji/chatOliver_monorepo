import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config({ path: "./.env" });

const rooms: Record<string, WebSocket[]> = {};
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = new WebSocketServer({ port });

console.log(`WebSocket server running on ws://localhost:${port}`);

server.on("connection", (ws) => {
    let joinedRoom: string | null = null;

    ws.on("message", (message) => {
        let parsed;
        try {
            parsed = JSON.parse(message.toString());
        } catch {
            ws.send(JSON.stringify({ error: "Invalid JSON" }));
            return;
        }

        if (parsed.type === "join" && parsed.payload?.roomId) {
            joinedRoom = String(parsed.payload.roomId);
            if (!rooms[joinedRoom]) {
                rooms[joinedRoom] = [];
            }
            if (!rooms[joinedRoom]!.includes(ws)) {
                rooms[joinedRoom]!.push(ws);
            }
            ws.send(JSON.stringify({ info: `Joined room ${joinedRoom}` }));
        }
        if (parsed.type === "chat" && joinedRoom && parsed.payload?.message) {
            // Broadcast to everyone in the room including sender
            rooms[joinedRoom]?.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(
                        JSON.stringify({
                            from: joinedRoom,
                            message: parsed.payload.message,
                        }),
                    );
                }
            });
        }
    });

    ws.on("close", () => {
        // Remove socket from all rooms
        Object.values(rooms).forEach((sockets) => {
            const idx = sockets.indexOf(ws);
            if (idx !== -1) sockets.splice(idx, 1);
        });
    });
});
