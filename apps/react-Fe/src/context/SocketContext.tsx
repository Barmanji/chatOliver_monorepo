import React, { createContext, useContext, useEffect, useState } from "react";
import socketio from "socket.io-client";
import { LocalStorage } from "../utils";
import { useAuth } from "./AuthContext";

// Function to establish a socket connection with authorization token
const getSocket = (token?: string | null) => {
  const authToken = token ?? LocalStorage.get("token");
  return socketio(import.meta.env.VITE_SOCKET_URI, {
    withCredentials: true,
    auth: { token: authToken },
  });
};

// Create a context to hold the socket instance
const SocketContext = createContext<{
  socket: ReturnType<typeof socketio> | null;
}>({
  socket: null,
});

// Custom hook to access the socket instance from the context
const useSocket = () => useContext(SocketContext);

// SocketProvider component to manage the socket instance and provide it through context
const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State to store the socket instance
  const [socket, setSocket] = useState<ReturnType<typeof socketio> | null>(
    null
  );
  const { token } = useAuth();

  // Initialize or re-initialize the socket connection when token changes
  useEffect(() => {
    const newSocket = getSocket(token);
    setSocket(newSocket);
    return () => {
      try {
        newSocket.disconnect();
      } catch (_) {}
    };
  }, [token]);

  return (
    // Provide the socket instance through context to its children
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
