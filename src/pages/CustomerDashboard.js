import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import '../styles/CustomerDashboard.css'; // Import CSS

function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const attributes = await fetchUserAttributes();
        setUser(attributes);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    fetchUserData();

    // Mock data for counsellors (Replace with API call)
    setCounsellors([
      { id: 1, name: 'Dr. John Doe', specialization: 'Anxiety' },
      { id: 2, name: 'Dr. Jane Smith', specialization: 'Relationship Counseling' },
    ]);
  }, []);

  const openChatWindow = (counsellor) => {
    setSelectedCounsellor(counsellor);
    setChatHistory([
      { from: 'Counsellor', message: 'Hello, how can I help you today?' },
      { from: 'Customer', message: 'I am feeling anxious and need some help.' },
    ]);
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

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="welcome-box">
        {user && <p className="welcome-text">Welcome, {user.email}</p>}
      </div>

      {/* Page Title */}
      <h1 className="page-title">Available Counsellors</h1>

      {/* Table for Counsellors */}
      <div className="table-container">
        <table className="counsellor-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counsellors.map((counsellor) => (
              <tr key={counsellor.id}>
                <td>{counsellor.name}</td>
                <td>{counsellor.specialization}</td>
                <td>
                  <button className="book-btn" onClick={() => openChatWindow(counsellor)}>
                    Book Session
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chat Modal Popup */}
      {isChatOpen && (
        <div className="chat-popup">
          <div className="chat-window">
            <div className="chat-header">
              <h2>Chat with {selectedCounsellor.name}</h2>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
