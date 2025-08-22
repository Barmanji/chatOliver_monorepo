import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XCircleIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/20/solid";
import { useEffect, useRef, useState } from "react";
import {
  deleteMessage,
  getChatMessages,
  getUserChats,
  sendMessage,
} from "../api";
import AddChatModal from "../components/chat/AddChatModal";
import ChatItem from "../components/chat/ChatItem";
import MessageItem from "../components/chat/MessageItem";
import Typing from "../components/chat/Typing";
import Input from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import type {
  ChatListItemInterface,
  ChatMessageInterface,
} from "../interfaces/chat";
import {
  LocalStorage,
  classNames,
  getChatObjectMetadata,
  requestHandler,
} from "../utils";

const CONNECTED_EVENT = "connected";
const DISCONNECT_EVENT = "disconnect";
const JOIN_CHAT_EVENT = "joinChat";
const NEW_CHAT_EVENT = "newChat";
const TYPING_EVENT = "typing";
const STOP_TYPING_EVENT = "stopTyping";
const MESSAGE_RECEIVED_EVENT = "messageReceived";
const LEAVE_CHAT_EVENT = "leaveChat";
const UPDATE_GROUP_NAME_EVENT = "updateGroupName";
const MESSAGE_DELETE_EVENT = "messageDeleted";

const ChatPage = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const currentChat = useRef<ChatListItemInterface | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [openAddChat, setOpenAddChat] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [chats, setChats] = useState<ChatListItemInterface[]>([]);
  const [messages, setMessages] = useState<ChatMessageInterface[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<ChatMessageInterface[]>(
    [],
  );

  const [isTyping, setIsTyping] = useState(false);
  const [selfTyping, setSelfTyping] = useState(false);

  const [message, setMessage] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // NOTE: Calling logic ------
  const [audioCallStatus, setAudioCallStatus] = useState(false);
  // @ts-ignore
  const [videoCallStatus, setVideoCallStatus] = useState(false);

  const updateChatLastMessage = (
    chatToUpdateId: string,
    message: ChatMessageInterface,
  ) => {
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    chatToUpdate.lastMessage = message;

    chatToUpdate.updatedAt = message?.updatedAt;

    setChats([
      chatToUpdate,
      ...chats.filter((chat) => chat._id !== chatToUpdateId),
    ]);
  };

  const updateChatLastMessageOnDeletion = (
    chatToUpdateId: string,
    message: ChatMessageInterface,
  ) => {
    const chatToUpdate = chats.find((chat) => chat._id === chatToUpdateId)!;

    if (chatToUpdate.lastMessage?._id === message._id) {
      requestHandler(
        async () => getChatMessages(chatToUpdateId),
        null,
        (req) => {
          const { data } = req;

          chatToUpdate.lastMessage = data[0];
          setChats([...chats]);
        },
        alert,
      );
    }
  };
  const getChats = async () => {
    requestHandler(
      async () => await getUserChats(),
      setLoadingChats,
      (res) => {
        const { data } = res;
        setChats(data || []);
      },
      alert,
    );
  };

  const getMessages = async () => {
    if (!currentChat.current?._id) return alert("No chat is selected");

    if (!socket) return alert("Socket not available");

    console.log("Emitting joinChat for chatId:", currentChat.current?._id);

    socket.emit(JOIN_CHAT_EVENT, currentChat.current?._id);

    setUnreadMessages(
      unreadMessages.filter((msg) => msg.chat !== currentChat.current?._id),
    );

    requestHandler(
      async () => await getChatMessages(currentChat.current?._id || ""),
      setLoadingMessages,
      (res) => {
        const { data } = res;
        setMessages(data || []);
      },
      alert,
    );
  };

  const sendChatMessage = async () => {
    if (!currentChat.current?._id || !socket) return;

    socket.emit(STOP_TYPING_EVENT, currentChat.current?._id);

    await requestHandler(
      async () =>
        await sendMessage(
          currentChat.current?._id || "",
          message,
          attachedFiles,
        ),
      null,
      (res) => {
        setMessage("");
        setAttachedFiles([]);
        setMessages((prev) => [res.data, ...prev]);
        updateChatLastMessage(currentChat.current?._id || "", res.data);
      },

      alert,
    );
  };
  const deleteChatMessage = async (message: ChatMessageInterface) => {
    await requestHandler(
      async () => await deleteMessage(message.chat, message._id),
      null,
      (res) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== res.data._id));
        updateChatLastMessageOnDeletion(message.chat, message);
      },
      alert,
    );
  };

  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!socket || !isConnected) return;

    if (!selfTyping) {
      setSelfTyping(true);

      socket.emit(TYPING_EVENT, currentChat.current?._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const timerLength = 3000;

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(STOP_TYPING_EVENT, currentChat.current?._id);

      setSelfTyping(false);
    }, timerLength);
  };

  const onConnect = () => {
    setIsConnected(true);
  };

  const onDisconnect = () => {
    setIsConnected(false);
  };

  const handleOnSocketTyping = (chatId: string) => {
    if (chatId !== currentChat.current?._id) return;

    setIsTyping(true);
  };

  const handleOnSocketStopTyping = (chatId: string) => {
    if (chatId !== currentChat.current?._id) return;

    setIsTyping(false);
  };

  const onMessageDelete = (message: ChatMessageInterface) => {
    if (message?.chat !== currentChat.current?._id) {
      setUnreadMessages((prev) =>
        prev.filter((msg) => msg._id !== message._id),
      );
    } else {
      setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
    }

    updateChatLastMessageOnDeletion(message.chat, message);
  };

  const onMessageReceived = (message: ChatMessageInterface) => {
    console.log("📨 Socket message received:", message);

    if (message?.chat !== currentChat.current?._id) {
      setUnreadMessages((prev) => [message, ...prev]);
    } else {
      setMessages((prev) => [message, ...prev]);
    }

    updateChatLastMessage(message.chat || "", message);
  };

  const onNewChat = (chat: ChatListItemInterface) => {
    setChats((prev) => [chat, ...prev]);
  };

  const onChatLeave = (chat: ChatListItemInterface) => {
    if (chat._id === currentChat.current?._id) {
      currentChat.current = null;
      LocalStorage.remove("currentChat");
    }
    setChats((prev) => prev.filter((c) => c._id !== chat._id));
  };

  const onGroupNameChange = (chat: ChatListItemInterface) => {
    if (chat._id === currentChat.current?._id) {
      currentChat.current = chat;

      LocalStorage.set("currentChat", chat);
    }

    setChats((prev) => [
      ...prev.map((c) => {
        if (c._id === chat._id) {
          return chat;
        }
        return c;
      }),
    ]);
  };

  // TODO: Gotta make them
  const connectAudioCall = () => {
    setAudioCallStatus(true);
  };
  const connectVideoCall = () => {
    setVideoCallStatus(true);
  };

  useEffect(() => {
    getChats();

    const _currentChat = LocalStorage.get("currentChat");

    if (_currentChat) {
      currentChat.current = _currentChat;
      socket?.emit(JOIN_CHAT_EVENT, _currentChat.current?._id);
      getMessages();
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      console.log("🟢 Socket connected with id:", socket.id);
      console.log("User ID (should match rooms):", user._id);
    });

    socket.onAny((event, ...args) => {
      console.log(`🔔 Socket event received: ${event}`, args);
    });

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on(CONNECTED_EVENT, onConnect);
    socket.on(DISCONNECT_EVENT, onDisconnect);
    socket.on(TYPING_EVENT, handleOnSocketTyping);
    socket.on(STOP_TYPING_EVENT, handleOnSocketStopTyping);
    socket.on(MESSAGE_RECEIVED_EVENT, onMessageReceived);
    socket.on(NEW_CHAT_EVENT, onNewChat);
    socket.on(LEAVE_CHAT_EVENT, onChatLeave);
    socket.on(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
    socket.on(MESSAGE_DELETE_EVENT, onMessageDelete);
    return () => {
      socket.off(CONNECTED_EVENT, onConnect);
      socket.off(DISCONNECT_EVENT, onDisconnect);
      socket.off(TYPING_EVENT, handleOnSocketTyping);
      socket.off(STOP_TYPING_EVENT, handleOnSocketStopTyping);
      socket.off(MESSAGE_RECEIVED_EVENT, onMessageReceived);
      socket.off(NEW_CHAT_EVENT, onNewChat);
      socket.off(LEAVE_CHAT_EVENT, onChatLeave);
      socket.off(UPDATE_GROUP_NAME_EVENT, onGroupNameChange);
      socket.off(MESSAGE_DELETE_EVENT, onMessageDelete);
    };
  }, [socket, chats]);

  return (
    <>
      <AddChatModal
        open={openAddChat}
        onClose={() => {
          setOpenAddChat(false);
        }}
        onSuccess={() => {
          getChats();
        }}
      />
      {/* NOTE: MAIN DIV */}
      <div className="w-full justify-between items-stretch h-screen flex flex-shrink-0">
        <div className="w-1/3 relative ring-white overflow-y-auto px-4">
          <div className="z-10 w-full sticky top-0 bg-dark py-4 flex justify-between items-center gap-4">
            <button
              type="button"
              className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-xl text-sm px-5 py-4 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 flex-shrink-0"
              onClick={logout}
            >
              Log Out
            </button>

            <Input
              placeholder="Search user or group..."
              value={localSearchQuery}
              onChange={(e) =>
                setLocalSearchQuery(e.target.value.toLowerCase())
              }
            />
            <button
              onClick={() => setOpenAddChat(true)}
              className="rounded-xl border-none bg-primary text-white py-4 px-5 flex flex-shrink-0"
            >
              + Add chat
            </button>
          </div>
          {loadingChats ? (
            <div className="flex justify-center items-center h-[calc(100%-88px)]">
              <Typing />
            </div>
          ) : (
            [...chats]
              .filter((chat) =>
                localSearchQuery
                  ? getChatObjectMetadata(chat, user!)
                      .title?.toLocaleLowerCase()
                      ?.includes(localSearchQuery)
                  : true,
              )
              .map((chat) => {
                return (
                  <ChatItem
                    chat={chat}
                    isActive={chat._id === currentChat.current?._id}
                    unreadCount={
                      unreadMessages.filter((n) => n.chat === chat._id).length
                    }
                    onClick={(chat) => {
                      if (
                        currentChat.current?._id &&
                        currentChat.current?._id === chat._id
                      )
                        return;
                      LocalStorage.set("currentChat", chat);
                      currentChat.current = chat;
                      setMessage("");
                      getMessages();
                    }}
                    key={chat._id}
                    onChatDelete={(chatId) => {
                      setChats((prev) =>
                        prev.filter((chat) => chat._id !== chatId),
                      );
                      if (currentChat.current?._id === chatId) {
                        currentChat.current = null;
                        LocalStorage.remove("currentChat");
                      }
                    }}
                  />
                );
              })
          )}
        </div>
        {/* NOTE: UPPER DIV / LOGOUT */}
        <div className="w-2/3 border-l-[0.1px] border-secondary">
          {currentChat.current && currentChat.current?._id ? (
            <>
              {/* NOTE: HEADER DIV STARTS -------------- */}
              <div className="p-4 sticky top-0 bg-dark z-20 flex justify-between items-center w-full border-b-[0.1px] border-secondary">
                <div className="flex justify-start items-center w-max gap-3">
                  {currentChat.current.isGroupChat ? (
                    <div className="w-12 relative h-12 flex-shrink-0 flex justify-start items-center flex-nowrap">
                      {currentChat.current.participants
                        .slice(0, 3)
                        .map((participant, i) => {
                          return (
                            <img
                              key={participant._id}
                              src={participant.avatar}
                              className={classNames(
                                "w-9 h-9 border-[1px] border-white rounded-full absolute outline outline-4 outline-dark",
                                i === 0
                                  ? "left-0 z-30"
                                  : i === 1
                                    ? "left-2 z-20"
                                    : i === 2
                                      ? "left-4 z-10"
                                      : "",
                              )}
                            />
                          );
                        })}
                    </div>
                  ) : (
                    <img
                      className="h-14 w-14 rounded-full flex flex-shrink-0 object-cover"
                      src={
                        getChatObjectMetadata(currentChat.current, user!).avatar
                      }
                    />
                  )}
                  <div>
                    <p className="font-bold">
                      {getChatObjectMetadata(currentChat.current, user!).title}
                    </p>
                    <small className="text-zinc-400">
                      {
                        getChatObjectMetadata(currentChat.current, user!)
                          .description
                      }
                    </small>
                  </div>
                </div>
                {/* Topbar icon */}
                <div className="flex flex-row lg:gap-6 md:gap-4">
                  <button
                    // TODO: for group and one-to-one will be different

                    onClick={connectAudioCall}
                    className="rounded-full bg-dark disabled:opacity-90"
                  >
                    <PhoneIcon className="h-6 hover:h-6.5 hover:opacity-70 transition-all ease-in-out duration-100 " />
                  </button>
                  <button
                    // TODO: for group and one-to-one will be different
                    onClick={connectVideoCall}
                    className="rounded-full disabled:opacity-90"
                  >
                    <VideoCameraIcon className="h-6 hover:h-6.5 hover:opacity-70 transition-all ease-in-out duration-100 " />
                  </button>
                  <EllipsisVerticalIcon className="h-6 hover:h-6.5 hover:opacity-70 transition-all ease-in-out duration-100 " />
                </div>
              </div>
              {/* NOTE: CHAT HEADER PART ENDS ------*/}
              {/*# NOTE: TEXT MODAL CHAT MAIN START -------- */}

              {!(audioCallStatus || videoCallStatus) ? (
                <div
                  className={classNames(
                    "p-8 overflow-y-auto flex flex-col-reverse gap-6 w-full",
                    attachedFiles.length > 0
                      ? "h-[calc(100vh-336px)]"
                      : "h-[calc(100vh-176px)]",
                  )}
                  id="message-window"
                >
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-[calc(100%-88px)]">
                      <Typing />
                    </div>
                  ) : (
                    <>
                      {isTyping ? <Typing /> : null}
                      {messages?.map((msg) => {
                        return (
                          <MessageItem
                            key={msg._id}
                            isOwnMessage={msg.sender?._id === user?._id}
                            isGroupChatMessage={
                              currentChat.current?.isGroupChat
                            }
                            message={msg}
                            deleteChatMessage={deleteChatMessage}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              ) : (
                <div>CALL STATUS</div>
              )}
              {/* NOTE: TEXT MODAL CHAT MAIN ENDS----------- */}
              {attachedFiles.length > 0 ? (
                <div className="grid gap-4 grid-cols-5 p-4 justify-start max-w-fit">
                  {attachedFiles.map((file, i) => {
                    return (
                      <div
                        key={i}
                        className="group w-32 h-32 relative aspect-square rounded-xl cursor-pointer"
                      >
                        <div className="absolute inset-0 flex justify-center items-center w-full h-full bg-black/40 group-hover:opacity-100 opacity-0 transition-opacity ease-in-out duration-150">
                          <button
                            onClick={() => {
                              setAttachedFiles(
                                attachedFiles.filter((_, ind) => ind !== i),
                              );
                            }}
                            className="absolute -top-2 -right-2"
                          >
                            <XCircleIcon className="h-6 w-6 text-white" />
                          </button>
                        </div>
                        <img
                          className="h-full rounded-xl w-full object-cover"
                          src={URL.createObjectURL(file)}
                          alt="attachment"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="sticky top-full p-4 flex justify-between items-center w-full gap-2 border-t-[0.1px] border-secondary">
                <input
                  hidden
                  id="attachments"
                  type="file"
                  value=""
                  multiple
                  max={5}
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachedFiles([...e.target.files]);
                    }
                  }}
                />
                <label
                  htmlFor="attachments"
                  className="p-4 rounded-full bg-dark hover:bg-secondary"
                >
                  <PaperClipIcon className="w-6 h-6" />
                </label>

                <Input
                  placeholder="Message"
                  value={message}
                  onChange={handleOnMessageChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendChatMessage();
                    }
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!message && attachedFiles.length <= 0}
                  className="p-4 rounded-full bg-dark hover:bg-secondary disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex justify-center items-center">
              No chat selected
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPage;
