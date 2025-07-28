import { useEffect, useRef, useState } from "react";
import { SearchBar } from "../components/search/SearchBar";
import { useAppSelector } from "../store/hooks";
import { useNavigate } from "react-router";
import { AuthService } from "../api/auth/auth";

// User type definition
interface User {
    _id: string;
    username: string;
    fullname: string;
}

export default function Chat() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const auth = new AuthService();
    const [currentUserID, setCurrentUserID] = useState<string | null>(null);

    useEffect(() => {
        auth.currentUser().then((user) => {
            setCurrentUserID(user._id);
        });
    }, []);

    const authValidation = useAppSelector(
        (state) => state.auth as { status: boolean; userData: User | null },
    );
    const navigate = useNavigate();

    useEffect(() => {
        if (!authValidation.status) {
            navigate("/login");
        }
    }, [authValidation.status, navigate]);

    useEffect(() => {
        if (!selectedUser) return;
        const roomId = [currentUserID, selectedUser._id].sort().join("-");
        const ws = new WebSocket("ws://localhost:3000");
        wsRef.current = ws;
        ws.onopen = () => {
            console.log("WebSocket opened");
            ws.send(JSON.stringify({ type: "join", payload: { roomId } }));
        };
        ws.onmessage = (e) => {
            console.log("message received", e.data);
            const data = JSON.parse(e.data);

            if (data.message) setMessages((prev) => [...prev, data.message]);
            console.log(data.payload?.message);
            console.log("data",data);
        };
        return () => ws.close();
    }, [selectedUser, currentUserID]);
    console.log(messages)


    function sendMessage() {
        if (
            wsRef.current &&
            wsRef.current.readyState === WebSocket.OPEN &&
            inputRef.current &&
            inputRef.current.value
        ) {
            wsRef.current.send(
                JSON.stringify({
                    type: "chat",
                    payload: { message: inputRef.current.value },
                }),
            );
            inputRef.current.value = "";
        }
    }

    return (
        <>
            <div className="search-bar-container">
                <SearchBar onUserSelect={setSelectedUser} />
            </div>
            {selectedUser ? (
                <div>
                    <div>
                        {messages.map((msg, i) => (
                            <div key={i}>{msg}</div>
                        ))}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            ) : (
                <div>Select a user to start chatting</div>
            )}
        </>
    );
}
