import React, { useState, useEffect } from "react";
import { fetchUserAttributes } from "@aws-amplify/auth";
import "../styles/CustomerDashboard.css";
import { useNavigate } from "react-router-dom";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
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
    };

    const fetchCounsellors = async () => {
      try {
        const response = await fetch(
          // "http://localhost:8080/api/users/counsellors"
          "https://kf680ti6bi.execute-api.ap-south-1.amazonaws.com/users/counsellors"
        );
        if (!response.ok) throw new Error("Failed to fetch counsellors");
        const data = await response.json();
        console.log("data", data);
        setCounsellors(data);
      } catch (error) {
        console.error("Error fetching counsellors:", error);
      }
    };

    fetchUserData();
    fetchCounsellors();
  }, []);

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      try {
        console.log("confirmed", user.uuid);
        const response = await fetch(
          // `http://localhost:8081/api/bookings/customer/${user.uuid}`
          `https://kf680ti6bi.execute-api.ap-south-1.amazonaws.com/booking/customer/${user.uuid}`
        );
        if (!response.ok) throw new Error("Failed to fetch confirmed bookings");
        const data = await response.json();
        console.log("confirmed", data);
        setUpcomingAppointments(data);
      } catch (error) {
        console.error("Error fetching confirmed bookings:", error);
      }
    };

    if (user && user.uuid) {
      fetchUpcomingAppointments();
    }
  }, [user]);

  const saveUserToDatabase = async (userData) => {
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
      if (!response.ok) throw new Error(data);
    } catch (error) {
      console.error("Error sending user data:", error);
    }
  };

  const sendChatRequest = async (selectedCounsellor) => {
    try {
      const response = await fetch(
        "http://localhost:8082/api/messages/sendRequest",
        // "https://itsbetterwellness.com/api/messages/sendRequest",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: user?.uuid,
            receiverId: selectedCounsellor?.uuid,
            customerName: user?.name,
            session: selectedCounsellor?.specialization,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text(); // Read error response
        throw new Error(`Failed to send message: ${errorText}`);
      }

      console.log("Chat Request sent successfully!");
    } catch (error) {
      console.error("Error sending chat request:", error.message);
    }
  };

  const handleBookSession = (selectedCounsellor) => {
    if (!user) {
      console.error("User data is not available yet!");
      return;
    }
    if (!selectedCounsellor) {
      console.error("No counsellor selected!");
      return;
    }
    sendChatRequest(selectedCounsellor);
    const userData = {
      username: user.name,
      userType: user.role,
      senderId: user.uuid,
      receiverId: selectedCounsellor.uuid,
    };
    navigate("/chat", { state: userData, replace: true });
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
        {user && <p className="welcome-text">Welcome, {user.name}</p>}
      </div>
      <h1 className="page-title">Available Counsellors</h1>
      <div className="table-container">
        <table className="counsellor-table">
          <thead>
            <tr>
              <th>Counsellor</th>
              <th>Specialization</th>
              <th>Book Session</th>
            </tr>
          </thead>
          <tbody>
            {counsellors.map((counsellor) => (
              <tr key={counsellor.uuid}>
                <td>Dr. {counsellor.name}</td>
                <td>{counsellor.specialization}</td>
                <td>
                  <button
                    className="book-btn"
                    onClick={() => handleBookSession(counsellor)}
                  >
                    Start Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {upcomingAppointments.length > 0 && (
        <div className="confirmed-bookings-container">
          <h1 className="page-title">Upcoming Appointments</h1>
          <table className="counsellor-table">
            <thead>
              <tr>
                <th>Counsellor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Session</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{appointment.counsellorName}</td>
                  <td>{formatDate(appointment.sessionDate)}</td>
                  <td>{appointment.sessionTime}</td>
                  <td>{appointment.session}</td>
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

export default CustomerDashboard;
