import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import { WebSocketServer, WebSocket } from "ws";
// // const allSockets: WebSocket[] = []
// const allSockets: Record<string, WebSocket[]> = {
//     // "room1": [Socket1, soc2]
// };
//
// const wss = new WebSocketServer({ port: 3000 });
//
// wss.on("connection", function connection(ws) {
//     ws.on("message", (message) => {
//         const parsedMessage = JSON.parse(message as unknown as string);
//         if (parsedMessage.type === "join") {
//             const room = parsedMessage.payload.roomId;
//             (allSockets[room] ??= []).push(ws);
//         }
//
//         if (parsedMessage.type === "chat") {
//             let currentUserRoom: string | null = null;
//
//             for (const room in allSockets) {
//                 if (allSockets[room].includes(ws)) {
//                     currentUserRoom = room;
//                     break;
//                 }
//             }
//         }
//     });
//     // { “type™: "join", // from postman it comes as string make it in JSON
//     //     "payload": {
//     //         "roomId": 123
//     //     }
//     // }
// });
// ws.on('disconnect', () => {
//    allSockets.filter(e => e != ws)
// })
// });
//

const port: null | any = process.env.PORT;
const wss = new WebSocketServer({ port });

interface User {
    socket: WebSocket;
    room: string;
    // [{socket: abc, room: abc}, {}]
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message as unknown as string);
        if (parsedMessage.type == "join") {
            console.log("user joined room " + parsedMessage.payload.roomId);
            allSockets.push({
                socket,
                room: parsedMessage.payload.roomId,
            });
        }

        if (parsedMessage.type == "chat") {
            console.log("user wants to chat");
            // const currentUserRoom = allSockets.find((x) => x.socket == socket).room
            let currentUserRoom = null;
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].socket == socket) {
                    currentUserRoom = allSockets[i].room;
                }
            }

            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].room == currentUserRoom) {
                    allSockets[i].socket.send(parsedMessage.payload.message);
                }
            }
        }
    });
});
