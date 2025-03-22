import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation  } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function ChatComponent () {
    const location = useLocation();
    const navigate = useNavigate();
    const { username, userType } = location.state || {}; // Ensure username is passed

    const [stompClient, setStompClient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!username) {
            console.warn("No username found. Redirecting to dashboard...");
            navigate("/");
            return;
        }

        const socket = new SockJS(`http://localhost:8082/ws?username=${username}`);

        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // Auto-reconnect after 5 seconds
            debug: (str) => console.log(str), // Debugging logs
            onConnect: () => {
                console.log("Connected to WebSocket");
                client.subscribe("/topic/chat", (msg) => {
                    setMessages((prevMessages) => [...prevMessages, JSON.parse(msg.body)]);
                });

                client.publish({
                    destination: "/app/chat.addUser",
                    body: JSON.stringify({ sender: username, type: "JOIN" }),
                });
            },
            onStompError: (error) => console.error("STOMP Error:", error),
        });

        client.activate(); // Start connection
        setStompClient(client);

        return () => {
            client.deactivate(); // Cleanup connection on unmount
        };
    }, [username, navigate]);

    const sendMessage = () => {
        if (stompClient && message.trim() !== "") {
            const chatMessage = {
                sender: username,
                content: message,
                type: "CHAT",
            };
            stompClient.publish({
                destination: "/app/chat.sendMessage",
                body: JSON.stringify(chatMessage),
            });
            setMessage("");
        }
    };

    return (
        <div className="chat-container border rounded-lg p-4 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Chat - {username} ({userType})</h2>
            <div className="chat-box border p-2 mb-2 h-64 overflow-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={msg.sender === username ? "text-right" : "text-left"}>
                        <span className="font-semibold">{msg.sender}:</span> {msg.content}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border rounded p-1 w-full"
                placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="bg-blue-500 text-white px-3 py-1 rounded mt-2">
                Send
            </button>
        </div>
    );
};

export default ChatComponent;
