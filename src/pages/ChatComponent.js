import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "../styles/ChatComponent.css";
import "../styles/Popup.css";

function ChatComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, userType, senderId, receiverId, session } =
    location.state || {};

  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    if (!username) {
      console.warn("No username found. Redirecting to dashboard...");
      navigate("/");
      return;
    }

    // const socket = new SockJS(`http://localhost:8082/ws?username=${username}`);
    const socket = new SockJS(
      `wss://q7fvrk7cjf.execute-api.ap-south-1.amazonaws.com/messaging/ws?username=${username}`
    );

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");
        client.subscribe("/topic/chat", (msg) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            JSON.parse(msg.body),
          ]);
        });

        client.publish({
          destination: "/app/chat.addUser",
          body: JSON.stringify({ sender: username, type: "JOIN" }),
        });
      },
      onStompError: (error) => console.error("STOMP Error:", error),
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
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

  const leaveChat = () => {
    if (userType === "customer") {
      navigate("/customer");
    } else {
      navigate("/counsellor");
    }
  };

  const bookAppointment = () => {
    console.log("Open");
    setShowPopup(true);
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        // "http://localhost:8081/api/bookings/create",
        "https://q7fvrk7cjf.execute-api.ap-south-1.amazonaws.com/bookings/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: receiverId,
            customerName: customerName,
            counsellorId: senderId,
            counsellorName: username,
            sessionDate: appointmentDate,
            sessionTime: appointmentTime,
            session: session,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to book appointment: ${errorText}`);
      }

      updateBookingStatus(senderId, receiverId);

      alert(
        `Appointment booked for ${appointmentDate} at ${appointmentTime} with Dr. ${username} for 1 hour.`
      );
      setShowPopup(false);
    } catch (error) {
      console.error("Error booking appointment:", error.message);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const updateBookingStatus = async (senderId, receiverId) => {
    // const url = `http://localhost:8082/api/messages/updateBookingStatus?senderId=${receiverId}&receiverId=${senderId}`;
    const url = `https://q7fvrk7cjf.execute-api.ap-south-1.amazonaws.com/messaging/updateBookingStatus?senderId=${receiverId}&receiverId=${senderId}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const message = await response.text();
        console.log(message);
      } else {
        const error = await response.text();
        console.error("Error:", error);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">
        Chat - {username} ({userType})
      </h2>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === username
                ? "customer-message"
                : "counsellor-message"
            }`}
          >
            {msg.type === "JOIN" ? (
              <span className="font-semibold">{msg.sender} joined!</span>
            ) : msg.type === "LEAVE" ? (
              <span className="font-semibold">{msg.sender} left!</span>
            ) : (
              <>
                <span className="font-semibold">{msg.sender}:</span>{" "}
                {msg.content}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="message-input-container">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <div className="button-group">
          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
          {userType === "counsellor" && (
            <button className="book-appointment-btn" onClick={bookAppointment}>
              Book Appointment
            </button>
          )}
          <button className="leave-chat-btn" onClick={leaveChat}>
            Leave Chat
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Book Appointment</h3>
            <form onSubmit={handleSubmitAppointment}>
              <div>
                <label>Customer Name:</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Date:</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Time:</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Counsellor Name:</label>
                <input type="text" value={username} readOnly />
              </div>
              <div>
                <label>Session:</label>
                <input type="text" value={session} readOnly />
              </div>
              <div className="popup-buttons">
                <button type="submit">Submit</button>
                <button type="button" onClick={() => setShowPopup(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatComponent;
