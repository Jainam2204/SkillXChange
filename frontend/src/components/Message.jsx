import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";
const socket = io(BACKEND_URL, { autoConnect: false });

const ChatInterface = ({ loggedInUserId, selectedUserId }) => {
  const [selectedUserName, setSelectedUserName] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedUserId || !loggedInUserId) return;

    socket.connect();
    socket.emit("join", loggedInUserId);

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/messages/${loggedInUserId}/${selectedUserId}`
        );
        if (response.ok) {
          const data = await response.json();
          setSelectedUserName(data.selectedUserName || "Unknown");

          let unreadCountLocal = 0;
          const sortedMessages = data.messages.map((msg) => {
            const isUnread = !msg.isRead && msg.receiver === loggedInUserId;

            if (isUnread) {
              unreadCountLocal++;
            }
            return { ...msg, isUnread };
          });
          console.log(unreadCountLocal + " unread messages");
          setUnreadCount(unreadCountLocal);

          setMessages(sortedMessages);
        } else {
          console.error("Failed to fetch messages");
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    socket.on("receiveMessage", (newMessage) => {
      if (!newMessage) return;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
    };
  }, [loggedInUserId, selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    const newMessage = {
      sender: loggedInUserId,
      receiver: selectedUserId,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    socket.emit("sendMessage", newMessage);
    setMessage("");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);

    if (!hasInteracted && unreadCount > 0) {
      setHasInteracted(true);
      markMessagesAsRead();
    }
  };

  const sendFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sender", loggedInUserId);
    formData.append("receiver", selectedUserId);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // const data = await response.json();
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        console.error("File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!hasInteracted && unreadCount > 0) {
      setHasInteracted(true);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await fetch(
        `${BACKEND_URL}/messages/markAsRead/${loggedInUserId}/${selectedUserId}`,
        {
          method: "PUT",
        }
      );

      setUnreadCount(0);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.receiver === loggedInUserId ? { ...msg, isUnread: false } : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  return (
    <div className="ml-64 flex flex-col h-screen">
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <span className="text-lg font-semibold">{selectedUserName}</span>
        {unreadCount > 0 && (
          <span className="text-sm bg-red-500 px-2 py-1 rounded-full">
            {unreadCount} unread messages
          </span>
        )}
      </div>

      <div className="flex-1 p-4 bg-gray-100 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 ${
                msg.sender === loggedInUserId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg shadow-md max-w-xs ${
                  msg.sender === loggedInUserId
                    ? "bg-blue-500 text-white"
                    : "bg-white text-black"
                } ${
                  msg.isUnread ? "border border-red-500 rounded-md p-1" : ""
                }`}
              >
                {msg.message && <p>{msg.message}</p>}
                {msg.fileUrl && (
                  <a
                    href={`${BACKEND_URL}${msg.fileUrl}`}
                    target="_self"
                    rel="noopener noreferrer"
                    className={`underline font-semibold ${
                      msg.sender === loggedInUserId
                        ? "text-right text-white"
                        : "text-left text-black"
                    }`}
                  >
                    {msg.fileName ? msg.fileName : msg.fileUrl.split("/").pop()}
                  </a>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t flex items-center">
        <input
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="flex-1 p-2 border rounded-md outline-none mr-2"
        />
        <button
          onClick={sendFile}
          disabled={!file}
          className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
        >
          Send File
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-md outline-none"
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-md ml-2"
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
