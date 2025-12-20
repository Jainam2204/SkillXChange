import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { toast } from "react-toastify";
import api from "../../utils/api";
import ReportUserDialog from "../../components/ReportDialog";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import useAuth from "../../hooks/useAuth";

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportedUsers, setReportedUsers] = useState({});
  const [creatingMeetingId, setCreatingMeetingId] = useState(null);

  const navigate = useNavigate();
  const { meetingNotifications } = useNotifications();
  const { user: currentUser, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const fetchConnections = async () => {
      if (!currentUser?._id) {
        toast.error("You must be logged in to view connections");
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/connect/connections");
        const list = res.data.data || [];
        setConnections(list);

        const statusMap = {};
        await Promise.all(
          list.map(async (conn) => {
            try {
              const statusRes = await api.get(
                `/report/has-reported/${conn._id}?reporterId=${currentUser._id}`
              );
              statusMap[conn._id] = !!statusRes.data.hasReported;
            } catch (err) {
              console.warn("Failed to check report status for", conn._id, err);
            }
          })
        );

        setReportedUsers(statusMap);
      } catch (err) {
        console.error("Error fetching connections:", err);
        toast.error("Failed to fetch connections");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [authLoading, currentUser?._id]);

  const handleStartMeeting = async (inviteeId) => {
    if (!currentUser?._id) {
      toast.error("Please log in to start a meeting");
      return;
    }

    try {
      setCreatingMeetingId(inviteeId);
      const res = await api.post("/meetings", {
        title: "",
        inviteeId,
      });

      const meetingId = res.data?.meetingId;
      if (!meetingId) throw new Error("Failed to create meeting");

      navigate(`/meet/${meetingId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setCreatingMeetingId(null);
    }
  };

  const getActiveMeetingForConnection = (connectionId) => {
    return Object.values(meetingNotifications).find(
      (notif) => notif.connectionId === connectionId
    );
  };

  if (loading || authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#e3f2fd",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#e3f2fd",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#1e293b",
            mb: 1,
          }}
        >
          Connections
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b", mb: 4 }}>
          Connect with people who have the skills you want and want the skills you already know.
        </Typography>

        {!connections.length ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
            }}
          >
            <Typography sx={{ color: "#64748b" }}>
              You haven't connected with anyone yet
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {connections.map((conn) => {
              const alreadyReported = reportedUsers[conn._id];

              return (
                <Grid item xs={12} sm={6} md={4} key={conn._id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            fontSize: "1.5rem",
                            backgroundColor: "#1976d2",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          {conn.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b", mb: 0.5 }}>
                            {conn.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748b" }}>
                            {conn.email}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, color: "#1e293b" }}>
                          <strong>Skills Have:</strong> {conn.skillsHave?.join(", ") || "N/A"}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: "#1e293b" }}>
                          <strong>Skills Want:</strong> {conn.skillsWant?.join(", ") || "N/A"}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          sx={{
                            textTransform: "none",
                            borderRadius: 1,
                            flex: 1,
                          }}
                          disabled={alreadyReported}
                          onClick={() => {
                            setReportTarget(conn);
                            setReportOpen(true);
                          }}
                        >
                          {alreadyReported ? "Reported" : "Report"}
                        </Button>

                        {getActiveMeetingForConnection(conn._id) ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ChatIcon />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 1,
                              flex: 1,
                              backgroundColor: "#10b981",
                              "&:hover": { backgroundColor: "#059669" },
                            }}
                            onClick={() => {
                              const active = getActiveMeetingForConnection(conn._id);
                              if (active) {
                                navigate(`/meet/${active.meetingId}`);
                              }
                            }}
                          >
                            Join Meet
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<ChatIcon />}
                            sx={{
                              textTransform: "none",
                              borderRadius: 1,
                              flex: 1,
                              backgroundColor: "#1976d2",
                              "&:hover": { backgroundColor: "#1565c0" },
                            }}
                            onClick={() => handleStartMeeting(conn._id)}
                            disabled={creatingMeetingId === conn._id}
                          >
                            {creatingMeetingId === conn._id ? "Starting..." : "Meet"}
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {reportTarget && currentUser && (
        <ReportUserDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={currentUser._id}
          reportedUserId={reportTarget._id}
          reportedUserName={reportTarget.name}
          hasReported={!!reportedUsers[reportTarget._id]}
          setHasReported={(val) =>
            setReportedUsers((prev) => ({
              ...prev,
              [reportTarget._id]: val,
            }))
          }
        />
      )}
    </Box>
  );
};

export default Connections;
