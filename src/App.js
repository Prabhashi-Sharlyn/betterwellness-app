import './App.css';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from '@aws-amplify/auth';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import CustomerDashboard from './pages/CustomerDashboard';
import CounsellorDashboard from './pages/CounsellorDashboard';
import awsExports from './aws-exports';
import { useState, useEffect } from 'react';

Amplify.configure(awsExports);

function AuthenticatedApp({ user, signOut }) {
  const [userRole, setUserRole] = useState(null);
  // const [counsellerSpecialization, setCounsellerSpecialization] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchUserDetails() {
      try {
        if (user && isMounted) {
          const attributes = await fetchUserAttributes();
          console.log('User Attributes:', attributes);

          const role = attributes['custom:userType'];
          setUserRole(role);

          const specialization = attributes['custom:specialization'];
          console.log('specialization', specialization);
          // setCounsellerSpecialization(specialization);

          if (role === 'customer') {
            navigate('/customer', { replace: true });
          } else if (role === 'counsellor') {
            navigate('/counsellor', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    }

    fetchUserDetails();

    return () => {
      isMounted = false; // Cleanup function to prevent re-fetching
    };
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");// Redirect to home after sign-out
  };

  return (
    <div>
      <button onClick={handleSignOut}>Sign Out</button>
      {userRole && <p>Role: {userRole}</p>}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Authenticator
          signUpAttributes={['custom:userType']}
          formFields={{
            signUp: {
              email: {
                label: 'Email',
                placeholder: 'Enter your email',
                required: true,
              },
              password: {
                label: 'Password',
                placeholder: 'Enter your password',
                required: true,
              },
              confirm_password: {
                label: 'Confirm Password',
                placeholder: 'Confirm your password',
                required: true,
              },
              name: {
                label: 'Name',
                placeholder: 'Enter Name',
                required: true,
              },
              'custom:userType': {
                label: 'Role',
                placeholder: 'Enter your role (customer/counsellor)',
                required: true,
              },
              'custom:specialization': {
                label: 'Specialization',
                placeholder: 'Enter counsellor specialization',
              },
            },
          }}
        >
          {({ signOut, user }) => {
            return user ? <AuthenticatedApp user={user} signOut={signOut} /> : <Navigate to="/" />;
          }}
        </Authenticator>

        <Routes>
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/counsellor" element={<CounsellorDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
