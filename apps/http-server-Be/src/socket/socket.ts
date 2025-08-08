import cookie from "cookie";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { ChatEventEnum } from "../constants.js";
import { User, IUser } from "../models/user/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import type { Request } from "express";

/** Types */
type AvailableChatEvents = (typeof ChatEventEnum)[keyof typeof ChatEventEnum];

type SocketWithUser = Socket & { user?: Pick<IUser, "_id"> & Partial<IUser> };

/**
 * @description This function is responsible to allow user to join the chat represented by chatId (chatId). event happens when user switches between the chats
 */
const mountJoinChatEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId: string) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    // joining the room with the chatId will allow specific events to be fired where we don't bother about the users like typing events
    // E.g. When user types we don't want to emit that event to specific participant.
    // We want to just emit that to the chat where the typing is happening
    socket.join(chatId);
  });
};

/**
 * @description This function is responsible to emit the typing event to the other participants of the chat
 */
const mountParticipantTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

/**
 * @description This function is responsible to emit the stopped typing event to the other participants of the chat
 */
const mountParticipantStoppedTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

/**
 * Initialize socket server
 */
const initializeSocketIO = (io: Server) => {
  return io.on("connection", async (rawSocket: Socket) => {
    const socket = rawSocket as SocketWithUser;
    try {
      // parse the cookies from the handshake headers (This is only possible if client has `withCredentials: true`)
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

      let token: string | undefined = cookies?.accessToken;

      if (!token) {
        // If there is no access token in cookies. Check inside the handshake auth
        token = (socket.handshake.auth as Record<string, string | undefined> | undefined)?.token;
      }

      if (!token) {
        // Token is required for the socket to work
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as { _id: string };

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      // retrieve the user
      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. Token is invalid");
      }
      socket.user = user as unknown as SocketWithUser["user"]; // mount the user object to the socket

      // We are creating a room with user id so that if user is joined but does not have any active chat going on.
      // still we want to emit some socket events to the user.
      // so that the client can catch the event and show the notifications.
      socket.join(user._id!.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT); // emit the connected event so that client is aware
      console.log("User connected 🗼. userId: ", user._id!.toString());

      // Common events that needs to be mounted on the initialization
      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStoppedTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log("user has disconnected 🚫. userId: " + socket.user?._id);
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong while connecting to the socket.";
      socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, message);
    }
  });
};

/**
 * @param req - Request object to access the `io` instance set at the entry point
 * @param roomId - Room where the event should be emitted
 * @param event - Event that should be emitted
 * @param payload - Data that should be sent when emitting the event
 * @description Utility function responsible to abstract the logic of socket emission via the io instance
 */
const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: AvailableChatEvents,
  payload: unknown
): void => {
  (req.app.get("io") as Server).in(roomId).emit(event, payload);
};

export { initializeSocketIO, emitSocketEvent };

