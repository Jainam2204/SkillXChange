import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  alpha,
  Badge,
  Popover,
  Card,
  CardContent,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useNotifications } from "../context/NotificationContext";
import api from "../utils/api";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const navigate = useNavigate();
  const navItems = ["Dashboard", "Connections", "Chat", "Subscription", "Profile"];
  const { meetingNotifications, removeMeetingNotification } = useNotifications();

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleJoinMeet = (meetingId) => {
    removeMeetingNotification(meetingId);
    handleNotificationClose();
    navigate(`/meet/${meetingId}`);
  };

  const handleDismissNotification = (meetingId) => {
    removeMeetingNotification(meetingId);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed");
    }
  };

  const notificationCount = Object.keys(meetingNotifications).length;
  const open = Boolean(notificationAnchorEl);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          backgroundColor: "#ffffff",
          color: "#0f1724",
          boxShadow: "0px 4px 16px rgba(16,24,40,0.06)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: 4 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              sx={{ color: "text.primary", display: { xs: "flex", md: "none" } }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Typography
                variant="h6"
                component="a"
                href="/dashboard"
                sx={{
                  textDecoration: "none",
                  fontWeight: 700,
                  color: "#0f1724",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                }}
              >
                <Box component="span" sx={{ color: "#0B75C9", fontWeight: 800 }}>
                  Skill
                </Box>
                <Box component="span" sx={{ color: "#0f1724" }}>
                  XChange
                </Box>
              </Typography>
            </motion.div>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
              {navItems.map((item) => (
                <motion.div key={item} whileHover={{ y: -2 }}>
                  <Button
                    href={`/${item.toLowerCase()}`}
                    sx={{
                      color: "text.primary",
                      fontWeight: 600,
                      textTransform: "none",
                      borderRadius: 2,
                      "&:hover": {
                        backgroundColor: alpha("#0B75C9", 0.06),
                        color: "#0B75C9",
                      },
                    }}
                  >
                    {item}
                  </Button>
                </motion.div>
              ))}
            </Box>

            <IconButton sx={{ color: "#0B75C9" }} onClick={handleNotificationClick}>
              <Badge badgeContent={notificationCount} color="primary">
                <NotificationsActiveIcon />
              </Badge>
            </IconButton>

            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Button
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    color: "#0B75C9",
                    backgroundColor: alpha("#0B75C9", 0.06),
                    fontWeight: 700,
                    borderRadius: "18px",
                    textTransform: "none",
                    px: 2.5,
                    py: 0.7,
                    border: `1px solid ${alpha("#0B75C9", 0.12)}`,
                    "&:hover": {
                      backgroundColor: alpha("#0B75C9", 0.1),
                    },
                  }}
                >
                  Logout
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{
            width: 260,
            backgroundColor: "#ffffff",
            height: "100%",
            color: "#0f1724",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: 800,
                mt: 1,
                mb: 1,
                color: "#0f1724",
              }}
            >
              Menu
            </Typography>
            <List>
              {navItems.map((item) => (
                <ListItem key={item} disablePadding>
                  <ListItemButton
                    component="a"
                    href={`/${item.toLowerCase()}`}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": {
                        backgroundColor: alpha("#0B75C9", 0.06),
                        color: "#0B75C9",
                      },
                    }}
                  >
                    <ListItemText primary={item} primaryTypographyProps={{ fontWeight: 600 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Drawer Logout */}
          <Box sx={{ mb: 2, textAlign: "center" }}>
            <Divider sx={{ mb: 1 }} />
            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                color: "#0B75C9",
                backgroundColor: alpha("#0B75C9", 0.08),
                fontWeight: 700,
                borderRadius: "18px",
                textTransform: "none",
                px: 3,
                py: 0.8,
                "&:hover": {
                  backgroundColor: alpha("#0B75C9", 0.12),
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Notification Popover */}
      <Popover
        open={open}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 360, maxHeight: 420, overflowY: "auto", p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Meeting Invitations
          </Typography>

          {notificationCount === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No pending meeting invitations
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {Object.entries(meetingNotifications).map(([meetingId, notif]) => (
                <Card
                  key={meetingId}
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha("#0B75C9", 0.12)}`,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <CardContent sx={{ pb: 1.25 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        📹 {notif.connectionName}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => handleDismissNotification(meetingId)}
                        sx={{
                          color: "text.secondary",
                          padding: 0,
                          "&:hover": { opacity: 0.8 },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1.25, color: "text.secondary" }}>
                      started a meeting with you
                    </Typography>

                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={() => handleJoinMeet(meetingId)}
                      sx={{
                        backgroundColor: "#0B75C9",
                        color: "#fff",
                        fontWeight: 700,
                        "&:hover": { backgroundColor: "#0962a8" },
                      }}
                    >
                      Join Meet
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Popover>

      <Box sx={{ height: { xs: 64, md: 72 } }} />
    </>
  );
};

export default Navbar;
