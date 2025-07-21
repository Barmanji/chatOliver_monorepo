import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { useNavigate } from "react-router";
import { SearchBar } from "../components/search/SearchBar";
import { SearchResultsList } from "../components/search/SearchResultList";

export default function Chat() {
    const [messages, setMessages] = useState<string[]>([]);
    const [results, setResults] = useState<any>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [myMessages, setMyMessages] = useState<string[]>([]);
    const roomId = "room1"; // TODO: Make this dynamic if needed
    const [preview, setPreview] = useState<string | null>(null);
    const auth = useAppSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.status) {
            navigate("/login");
        }
    }, [auth.status, navigate]);

    function sendMessage() {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }
        if (!inputRef.current) return;
        const value = inputRef.current.value;
        if (!value) return;
        wsRef.current.send(
            JSON.stringify({
                type: "chat",
                payload: {
                    message: value,
                },
            }),
        );
        inputRef.current.value = "";
        setMyMessages((prev) => [...prev, value]);
        // Clear preview if it matches the sent message
        setPreview((prevPreview) =>
            prevPreview === value ? null : prevPreview,
        );
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: "typing",
                    payload: { roomId, text: value },
                }),
            );
        }
    }

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3000");
        wsRef.current = ws;
        ws.onmessage = (e) => {
            let newMessage = e.data;
            try {
                const parsed = JSON.parse(e.data);
                if (parsed.message) {
                    newMessage = parsed.message;
                    // Clear preview if the received message matches the preview
                    setPreview((prevPreview) =>
                        prevPreview === newMessage ? null : prevPreview,
                    );
                } else if (parsed.info) {
                    newMessage = parsed.info;
                } else if (parsed.error) {
                    newMessage = `Error: ${parsed.error}`;
                } else if (parsed.type === "typing") {
                    setPreview(parsed.text);
                    return; // Don't add typing preview to messages
                }
            } catch {
                // Not JSON, just use as is
            }
            setMessages((prev) => [...prev, newMessage]);
        };

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    type: "join",
                    payload: {
                        roomId,
                    },
                }),
            );
        };
        return () => {
            ws.close();
        };
    }, []);

    return (
        <>
            <div className="search-bar-container">
                <SearchBar  />
                {results && results.length > 0 && (
                    <SearchResultsList results={results} />
                )}
            </div>
            <div className="flex flex-col justify-between h-screen p-4 items-center">

                <h1 className="font-bold text-3xl text-amber-500">
                    A Chat App
                </h1>

                <div className="text-amber-500 overflow-y-auto flex-1 my-4 w-full max-w-xl">
                    {messages.map((message, idx) => {
                        const isMine = myMessages.includes(message);
                        return (
                            <div
                                key={idx}
                                className={`flex w-full my-1 ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`px-4 py-2 rounded-lg max-w-xs break-words shadow-md ${
                                        isMine
                                            ? "bg-amber-400 text-white self-end"
                                            : "bg-white text-amber-700 self-start border border-amber-200"
                                    }`}
                                >
                                    {message}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Typing preview for other users */}
                {preview && (
                    <div className="text-xs text-blue-500 mb-2 w-full max-w-xl text-left">
                        Other user typing: {preview}
                    </div>
                )}

                <div className="flex items-center w-full max-w-xl">
                    <input
                        onChange={handleInputChange}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-3xl dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Message..."
                    />
                    <button
                        type="button"
                        className="focus:outline-none text-white bg-amber-500 hover:bg-amber-800 focus:ring-4 focus:ring-amber-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 ml-2 dark:bg-amber-600 dark:hover:bg-amber-700 dark:focus:ring-amber-900"
                        onClick={sendMessage}
                    >
                        Send
                    </button>
                </div>
            </div>
        </>
    );
}
