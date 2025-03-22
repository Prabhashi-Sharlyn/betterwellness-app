import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import '../styles/CounsellorDashboard.css'; // Import CSS
import ChatComponent from "./ChatComponent";
import { useNavigate } from "react-router-dom";

function CounsellorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookingRequests, setBookingRequests] = useState([]); // Renamed to bookingRequests
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [newBookingDetails, setNewBookingDetails] = useState({
    date: '',
    time: '',
    counselorName: '',
    specialization: ''
  });
  const [chatRequest, setChatRequests] = useState([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const attributes = await fetchUserAttributes();
        // setUser(attributes);

        const userData = {
          uuid: attributes.sub,  // Unique ID of the user
          email: attributes.email,
          name: attributes.name,
          role: attributes['custom:userType'], // Assuming role is stored as a custom attribute
          specialization: attributes['custom:specialization'] || '',
        };

        setUser(userData);

        // Send data to the backend to store in RDS
        await saveUserToDatabase(userData);

      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    const fetchMessageRequests = async () => {
      try {
        const response = await fetch("http://localhost:8082/api/messages/getRequests");
        if (!response.ok) throw new Error("Failed to fetch message requests");
        const data = await response.json();
        console.log('data', data);
        const pendingBookings = data.filter((booking) => booking.bookingStatus === 'PENDING');
        setChatRequests(pendingBookings);

      } catch (error) {
        console.error("Error fetching message requests:", error);
      }
    };

    fetchUserData();
    fetchMessageRequests();

    
    // Poll every 5 seconds to refresh the data
    const intervalId = setInterval(fetchMessageRequests, 5000); // Polling every 5 seconds

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);

  }, []);

  useEffect(() => {
    if (user && user.uuid) {
        fetchConfirmedBookings();
    }
}, [user]);

const fetchConfirmedBookings = async () => {
  try {
    console.log('confirmed', user.uuid);
    const response = await fetch(`http://localhost:8081/api/bookings/counsellor/${user.uuid}`);
    if (!response.ok) throw new Error("Failed to fetch confirmed bookings");
    const data = await response.json();
    console.log('confirmed', data);
    setConfirmedBookings(data);
  } catch (error) {
    console.error("Error fetching confirmed bookings:", error);
  }
};

  const openChatWindow = (booking) => {
    setSelectedBooking(booking);
    // setChatHistory([
    //   { from: 'Counsellor', message: 'Hello, how can I help you today?' },
    //   { from: 'Customer', message: 'I am feeling anxious and need some help.' },
    // ]);
    setIsChatOpen(true); // Open the chat window
  };

  const closeChatWindow = () => {
    setIsChatOpen(false); // Close the chat window
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatHistory([...chatHistory, { from: 'Customer', message: newMessage }]);
      setNewMessage('');

      // Integrate with messaging service here to send the message
      console.log('Sending message:', newMessage);
    }
  };

  const openBookingForm = () => {
    setIsBookingFormOpen(true);
  };

  const closeBookingForm = () => {
    setIsBookingFormOpen(false);
  };

  const handleConfirmBooking = () => {
    // Add new booking to confirmed bookings
    setConfirmedBookings([
      ...confirmedBookings,
      {
        id: confirmedBookings.length + 1,
        counsellor: newBookingDetails.counselorName,
        date: newBookingDetails.date,
        time: newBookingDetails.time,
        specialization: newBookingDetails.specialization
      }
    ]);

    // Remove from booking requests
    setBookingRequests(bookingRequests.filter((booking) => booking.id !== selectedBooking.id));

    setIsBookingFormOpen(false); // Close the booking form
    setIsChatOpen(false); // Close the chat window after booking
  };

  const handleBookingDetailsChange = (e) => {
    const { name, value } = e.target;
    setNewBookingDetails({
      ...newBookingDetails,
      [name]: value
    });
  };

  const saveUserToDatabase = async (userData) => {
    console.log('User Data', userData);
    try {
      const response = await fetch('http://localhost:8080/api/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.text();
      if (response.ok) {
        console.log('Success',data);
      } else {
        console.error('Error ', data);
      }
    } catch (error) {
      console.error('Error sending user data:', error);
    }
  };

  const handleBookSession = (selectChatRequest) => {
    console.log('selectChatRequest', selectChatRequest)
    const userData = { username: user.name, userType: user.role, senderId: user.uuid, receiverId: selectChatRequest.senderId, session:  selectChatRequest.session};
    navigate("/chat", { state: userData });
};

  const formatDateTime = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="welcome-box">
        {user && <p className="welcome-text">Welcome, Dr. {user.name}</p>}
      </div>

      {/* Page Title */}
      {chatRequest.length > 0 && (
      <>
      <h1 className="page-title">Booking Requests</h1>

      {/* Table for Booking Requests */}
      <div className="table-container">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Session</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {chatRequest.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.customerName}</td>
                <td>{formatDateTime(booking.timestamp)}</td>
                <td>{booking.session}</td>
                <td>
                  <button className="book-btn" onClick={() => handleBookSession(booking)}>
                    Start Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Chat Modal Popup */}
      {isChatOpen && selectedBooking && (
        <div className="chat-popup">
          <div className="chat-window">
            <div className="chat-header">
              <h2>Chat with {selectedBooking.counsellor}</h2>
              <button className="close-chat-btn" onClick={closeChatWindow}>X</button>
            </div>
            <div className="chat-history">
              {chatHistory.map((chat, index) => (
                <div key={index} className={chat.from === 'Customer' ? 'customer-message' : 'counsellor-message'}>
                  <p><strong>{chat.from}:</strong> {chat.message}</p>
                </div>
              ))}
            </div>
            <div className="message-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
              />
              <button onClick={handleSendMessage}>Send</button>
              <button className="book-session-btn" onClick={openBookingForm}>Book</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Popup
      {isBookingFormOpen && (
        <div className="booking-form-popup">
          <div className="booking-form-window">
            <h2>Confirm Your Booking</h2>
            <label>
              Date:
              <input
                type="date"
                name="date"
                value={newBookingDetails.date}
                onChange={handleBookingDetailsChange}
              />
            </label>
            <label>
              Time:
              <input
                type="time"
                name="time"
                value={newBookingDetails.time}
                onChange={handleBookingDetailsChange}
              />
            </label>
            <label>
              Counselor:
              <input
                type="text"
                name="counselorName"
                value={newBookingDetails.counselorName}
                onChange={handleBookingDetailsChange}
              />
            </label>
            <label>
              Specialization:
              <input
                type="text"
                name="specialization"
                value={newBookingDetails.specialization}
                onChange={handleBookingDetailsChange}
              />
            </label>
            <button onClick={handleConfirmBooking}>Confirm Booking</button>
            <button onClick={closeBookingForm}>Cancel</button>
          </div>
        </div>
      )} */}

      {/* Table for Confirmed Bookings */}
      {confirmedBookings.length > 0 && (
        <div className="confirmed-bookings-container">
          <h1 className="page-title">Confirmed Bookings</h1>
          <table className="counsellor-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {confirmedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.customerName}</td>
                  <td>{formatDate(booking.sessionDate)}</td>
                  <td>{booking.sessionTime}</td>
                  <td>{booking.session}</td>
                  <td>Confirmed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CounsellorDashboard;
