import React, { useState, useEffect } from 'react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import '../styles/CustomerDashboard.css';

function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const userData = {
          uuid: attributes.sub,
          email: attributes.email,
          name: attributes.name,
          role: attributes['custom:userType'],
          specialization: attributes['custom:specialization'] || '',
        };
        setUser(userData);
        await saveUserToDatabase(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const fetchCounsellors = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/users/counsellors');
        if (!response.ok) throw new Error('Failed to fetch counsellors');
        const data = await response.json();
        setCounsellors(data);
      } catch (error) {
        console.error('Error fetching counsellors:', error);
      }
    };

    fetchUserData();
    fetchCounsellors();
  }, []);

  const openChatWindow = (counsellor) => {
    setSelectedCounsellor(counsellor);
    setChatHistory([ { from: 'Counsellor', message: 'Hello, how can I help you today?' } ]);
    setIsChatOpen(true);
  };

  const closeChatWindow = () => setIsChatOpen(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatHistory([...chatHistory, { from: 'Customer', message: newMessage }]);
      setNewMessage('');
    }
  };

  const saveUserToDatabase = async (userData) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.text();
      if (!response.ok) throw new Error(data);
    } catch (error) {
      console.error('Error sending user data:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-box">{user && <p className="welcome-text">Welcome, {user.name}</p>}</div>
      <h1 className="page-title">Available Counsellors</h1>
      <div className="table-container">
        <table className="counsellor-table">
          <thead>
            <tr>
              <th>Counsellor</th>
              <th>Specialization</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counsellors.map((counsellor) => (
              <tr key={counsellor.uuid}>
                <td>Dr. {counsellor.name}</td>
                <td>{counsellor.specialization}</td>
                <td><button className="book-btn" onClick={() => openChatWindow(counsellor)}>Book Session</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isChatOpen && (
        <div className="chat-popup">
          <div className="chat-window">
            <div className="chat-header">
              <h2>Chat with Dr. {selectedCounsellor.name}</h2>
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
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message here..." />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
