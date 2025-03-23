import "./App.css";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "@aws-amplify/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "@aws-amplify/ui-react/styles.css";
import CustomerDashboard from "./pages/CustomerDashboard";
import CounsellorDashboard from "./pages/CounsellorDashboard";
import ChatComponent from "./pages/ChatComponent";
import awsExports from "./aws-exports";
import { useEffect } from "react";

Amplify.configure(awsExports);

function AuthenticatedApp({ user, signOut }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    async function fetchUserDetails() {
      try {
        if (user && isMounted) {
          const attributes = await fetchUserAttributes();
          const role = attributes["custom:userType"];

          if (location.pathname === "/chat") {
            return;
          }

          if (role === "customer") {
            navigate("/customer", { replace: true });
          } else if (role === "counsellor") {
            navigate("/counsellor", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error fetching user attributes:", error);
      }
    }

    fetchUserDetails();

    return () => {
      isMounted = false;
    };
  }, [user, navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="app-container">
      <button onClick={handleSignOut} className="signout-btn">
        Sign Out
      </button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <h1 className="app-title">Better Wellness Counselling</h1>
        <Authenticator
          signUpAttributes={["custom:userType"]}
          formFields={{
            signUp: {
              email: {
                label: "Email",
                placeholder: "Enter your email",
                required: true,
              },
              password: {
                label: "Password",
                placeholder: "Enter your password",
                required: true,
              },
              confirm_password: {
                label: "Confirm Password",
                placeholder: "Confirm your password",
                required: true,
              },
              name: {
                label: "Name",
                placeholder: "Enter Name",
                required: true,
              },
              "custom:userType": {
                label: "Role",
                placeholder: "Enter your role (customer/counsellor)",
                required: true,
              },
              "custom:specialization": {
                label: "Specialization",
                placeholder: "Enter counsellor specialization",
              },
            },
          }}
        >
          {({ signOut, user }) => {
            return user ? (
              <AuthenticatedApp user={user} signOut={signOut} />
            ) : (
              <Navigate to="/" />
            );
          }}
        </Authenticator>

        <Routes>
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/counsellor" element={<CounsellorDashboard />} />
          <Route path="/chat" element={<ChatComponent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
