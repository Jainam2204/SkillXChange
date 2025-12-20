import React, { useEffect, useState } from "react";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from "@mui/material";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { getSocket, disconnectSocket } from "../services/socket";
import { useNavigate } from "react-router-dom";
import { NotificationProvider } from "../context/NotificationContext";
import { MeetNotificationListener } from "./MeetNotificationListener";

const LayoutContent = ({ onLogout }) => {
  const [invite, setInvite] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
  if (!userData) return undefined;
  const s = getSocket();
    const handler = (payload) => {
      setInvite(payload);
    };
    s.on("meeting-invite", handler);
    return () => {
      try {
        s.off("meeting-invite", handler);
      } catch {
        // ignore
      }
    };
  }, []);

  const handleJoin = () => {
    if (invite?.meetingId) {
      const id = invite.meetingId;
      setInvite(null);
      navigate(`/meet/${id}`);
    } else {
      setInvite(null);
    }
  };

  const handleDismiss = () => setInvite(null);

  return (
    <Box
      sx={{
        m: 0,
        p: 0,
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        backgroundColor: "#f8fafc",
      }}
    >
      <MeetNotificationListener />
      <Navbar onLogout={onLogout} />
      <Box
        component="main"
        sx={{
          mt: 10,
          px: { xs: 2, sm: 4, md: 8 },
          py: 2,
        }}
      >
        <Outlet />
      </Box>
      <Dialog open={!!invite} onClose={handleDismiss}>
        <DialogTitle>Incoming meeting</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            You have been invited to join a meeting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismiss} color="inherit">Dismiss</Button>
          <Button onClick={handleJoin} variant="contained">Join</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const Layout = ({ onLogout }) => {
  return (
    <NotificationProvider>
      <LayoutContent onLogout={onLogout} />
    </NotificationProvider>
  );
};

export default Layout;
