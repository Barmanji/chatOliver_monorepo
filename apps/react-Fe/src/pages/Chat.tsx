import { useEffect, useRef, useState } from "react";

export default function Chat() {
    const [message, setMessage] = useState(["Default Msg", "hell"]);
    // const [socket, setSocket] = useState(); // initially its undef
    const wsRef = useRef();
    const inputRef = useRef(null); // useRef to get the input value
    function sendMessage() {
        // if (!socket) {
        //     return;
        // }
        // socket.send(inputRef.current.value);
        // TODO: Use ref here as well
        wsRef.current.send(
            JSON.stringify({
                type: "chat",
                payload: {
                    message: inputRef.current.value,
                },
            }),
        );
    }

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:3000");
        // setSocket(ws); // roll it up the state, bad approach
        wsRef.current = ws;
        ws.onmessage = (e) => {
            const newMessage = e.data;
            // ws.send("Message: " + e);
            setMessage((prev) => [...prev, newMessage]);
        };

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    type: "join",
                    payload: {
                        roomId: "ShouldNt Hard code",
                    },
                }),
            );
        };
        return () => {
            ws.close()
        }
    }, []);

    return (
        <>
            <div className="flex flex-col justify-between h-screen p-4 items-center">
                <h1 className="font-bold text-3xl text-amber-500">
                    A Chat App
                </h1>

                <div className="text-amber-500 overflow-y-auto flex-1 my-4">
                    {message.map((message) => (
                        <div> {message}</div>
                    ))}
                    {/* <ul> */}
                    {/*     {message.map((item, index) => ( */}
                    {/*         <li key={index}>{item}</li> */}
                    {/*     ))} */}
                    {/* </ul> */}
                </div>

                <div className="flex items-center">
                    <input
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        ref={inputRef}
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-3xl dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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


