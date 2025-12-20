import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import api from "./utils/api";

import SignupForm from "./pages/SignupForm";
import LoginForm from "./pages/login";
import VerifyEmailPage from "./pages/VerifyPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/Privateroutes";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout";
import Profile from "./pages/profile";
import Connections from "./pages/connections";
import MeetHome from "./pages/Meet";
import MeetingRoom from "./pages/Meet/Room";
import Chat from "./pages/Chat";
import Subscription from "./pages/Subscription";
import BannedPage from "./pages/BannedPage/BannedPage";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Silent fail on logout
    }

    setUser(null);
    window.location.href = "/login";
  };

  if (loadingUser) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4}
          sx={{ 
            color: 'white',
            mb: 2
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'white',
            fontWeight: 600,
            letterSpacing: 1
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path="/signup" element={<SignupForm />} />

        <Route path="/login" element={<LoginForm setUser={setUser} />} />

        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/banned" element={<BannedPage />} />
        <Route
          element={
            <PrivateRoute user={user}>
              <Layout onLogout={handleLogout} />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/meet" element={<MeetHome />} />
          <Route path="/meet/:id" element={<MeetingRoom />} />
          <Route path="/chat" element={<Chat user={user} setUser={setUser} />} />
          <Route path="/subscription" element={<Subscription />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
