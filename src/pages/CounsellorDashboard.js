import React, { useState, useEffect } from "react";
import { fetchUserAttributes } from "@aws-amplify/auth";
import "../styles/CounsellorDashboard.css";
import { useNavigate } from "react-router-dom";

function CounsellorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [chatRequest, setChatRequests] = useState([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const attributes = await fetchUserAttributes();

        const userData = {
          uuid: attributes.sub,
          email: attributes.email,
          name: attributes.name,
          role: attributes["custom:userType"],
          specialization: attributes["custom:specialization"] || "",
        };

        setUser(userData);

        await saveUserToDatabase(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }

    const fetchMessageRequests = async () => {
      try {
        const response = await fetch();
        // "http://localhost:8082/api/messages/getRequests"
        // "https://itsbetterwellness.com/api/messages/getRequests"
        if (!response.ok) throw new Error("Failed to fetch message requests");
        const data = await response.json();
        console.log("data", data);
        const pendingBookings = data.filter(
          (booking) => booking.bookingStatus === "PENDING"
        );
        setChatRequests(pendingBookings);
      } catch (error) {
        console.error("Error fetching message requests:", error);
      }
    };

    fetchUserData();
    fetchMessageRequests();

    const intervalId = setInterval(fetchMessageRequests, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchConfirmedBookings = async () => {
      try {
        console.log("confirmed", user.uuid);
        const response = await fetch(
          // `http://localhost:8081/api/bookings/counsellor/${user.uuid}`
          `hhttps://kf680ti6bi.execute-api.ap-south-1.amazonaws.com/booking/counsellor/${user.uuid}`
        );
        if (!response.ok) throw new Error("Failed to fetch confirmed bookings");
        const data = await response.json();
        console.log("confirmed", data);
        setConfirmedBookings(data);
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
      }
    };

    if (user && user.uuid) {
      fetchConfirmedBookings();
    }
  }, [user]);

  const saveUserToDatabase = async (userData) => {
    console.log("User Data", userData);
    try {
      // const response = await fetch("http://localhost:8080/api/users/save", {
      const response = await fetch(
        "https://kf680ti6bi.execute-api.ap-south-1.amazonaws.com/users/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.text();
      if (response.ok) {
        console.log("Success", data);
      } else {
        console.error("Error ", data);
      }
    } catch (error) {
      console.error("Error sending user data:", error);
    }
  };

  const handleBookSession = (selectChatRequest) => {
    console.log("selectChatRequest", selectChatRequest);
    const userData = {
      username: user.name,
      userType: user.role,
      senderId: user.uuid,
      receiverId: selectChatRequest.senderId,
      session: selectChatRequest.session,
    };
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
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-box">
        {user && <p className="welcome-text">Welcome, Dr. {user.name}</p>}
      </div>

      {chatRequest.length > 0 && (
        <>
          <h1 className="page-title">Booking Requests</h1>

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
                      <button
                        className="book-btn"
                        onClick={() => handleBookSession(booking)}
                      >
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
