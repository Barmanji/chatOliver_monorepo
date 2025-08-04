import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { WebSocketServer, WebSocket } from "ws";

const port = process.env.PORT!
const rooms: Record<string, WebSocket[]> = {};
const wss = new WebSocketServer({ port: port as unknown as number });

wss.on("connection", (ws) => {
    let joinedRoom: string | null = null;

    ws.on("message", (message) => {
        let parsed;
        try {
            parsed = JSON.parse(message.toString());
        } catch {
            ws.send(JSON.stringify({ error: "Invalid JSON" }));
            return;
        }

        if (parsed.type === "join") {
            const roomId = parsed.payload?.roomId;
            if (!roomId) return;
            joinedRoom = roomId;
            rooms[roomId] = rooms[roomId] || [];
            if (!rooms[roomId].includes(ws)) rooms[roomId].push(ws);
        }

        if (parsed.type === "chat" && joinedRoom) {
            const msg = parsed.payload?.message;
            if (!msg) return;
            if (rooms[joinedRoom]) {
                rooms[joinedRoom]!.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ message: msg }));
                    }
                });
            }
        }
    });

    ws.on("close", () => {
        // Remove ws from all rooms
        for (const roomId in rooms) {
            if (rooms[roomId]) {
                rooms[roomId] = rooms[roomId]!.filter(client => client !== ws);
                if (rooms[roomId].length === 0) delete rooms[roomId];
            }
        }
    });
});
