import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Stack,
  Avatar,
  LinearProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BoltIcon from "@mui/icons-material/Bolt";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const PRIMARY = "#0B75C9";
const MUTED = "#64748b";

const STAT_WIDTH = { xs: "100%", sm: "100%", md: "220px" }; 
const STAT_HEIGHT = 180; 

const StatCard = ({ icon, title, value, subtitle = "" }) => (
  <Paper
    elevation={1}
    sx={{
      width: STAT_WIDTH,
      height: STAT_HEIGHT,
      minHeight: STAT_HEIGHT,
      maxWidth: "100%",
      borderRadius: 3,
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      backgroundColor: "#fff",
      boxShadow: "0 8px 28px rgba(16,24,40,0.06)",
      px: 2,
    }}
  >
    <Avatar sx={{ bgcolor: "rgba(11,117,201,0.12)", color: PRIMARY, mb: 0.5 }}>
      {icon}
    </Avatar>

    <Typography variant="subtitle2" sx={{ color: MUTED, fontWeight: 600 }}>
      {title}
    </Typography>

    <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f1724" }}>
      {value}
    </Typography>

    {subtitle ? (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {subtitle}
      </Typography>
    ) : null}
  </Paper>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [reportStats, setReportStats] = useState({
    reportCount: 0,
    isBanned: false,
    maxAllowedBeforeBan: 3,
  });

  // fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.error(err);
        toast.error("You must be logged in");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchReportStats = async () => {
      if (!user) return;
      try {
        const res = await api.get("/report/my-stats");
        setReportStats(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch report stats");
      }
    };
    fetchReportStats();
  }, [user]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await api.get("/connect/connections");
        setConnections(res.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch connections");
      }
    };
    if (user) fetchConnections();
  }, [user]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user) return;
      try {
        const res = await api.get("/connect/suggestions");
        const filtered = Array.isArray(res.data)
          ? res.data.filter((s) => s.status !== "accepted")
          : [];
        setSuggestions(filtered);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch connection suggestions");
      }
    };
    fetchSuggestions();
  }, [user]);

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!suggestions.length || !user) return;
      const newStatuses = {};
      await Promise.all(
        suggestions.map(async (s) => {
          try {
            const res = await api.get("/connect/status", {
              params: { senderId: user._id, receiverId: s._id },
            });
            newStatuses[s._id] = res.data.status;
          } catch {
            newStatuses[s._id] = "none";
          }
        })
      );
      setStatuses(newStatuses);
    };
    fetchStatuses();
  }, [suggestions, user]);

  const handleConnect = async (receiverId) => {
    try {
      await api.post("/connect/request", { receiverId });
      toast.success("Connection request sent!");
      setStatuses((prev) => ({ ...prev, [receiverId]: "pending" }));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAccept = async (senderId) => {
    try {
      await api.post("/connect/accept", { senderId, receiverId: user._id });
      toast.success("You’re now connected!");
      setSuggestions((prev) => prev.filter((s) => s._id !== senderId));
      setStatuses((prev) => ({ ...prev, [senderId]: "accepted" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (senderId) => {
    try {
      await api.post("/connect/reject", { senderId, receiverId: user._id });
      toast.info("Connection request rejected!");
      setStatuses((prev) => ({ ...prev, [senderId]: "none" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject request");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ backgroundColor: "#eaf7ff", minHeight: "100vh", pb: 6, pt: 6 }}>
      <Container>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            mb: 4,
            background: "#fff",
            boxShadow: "0 10px 30px rgba(16,24,40,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              Find people who match your skills and start learning together.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: { xs: 2, md: 0 } }}>
            <Button
              variant="contained"
              onClick={() => navigate("/connections")}
              sx={{
                backgroundColor: PRIMARY,
                "&:hover": { backgroundColor: "#0962a8" },
                px: 3,
                py: 1,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              Find Connections
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/profile")}
              sx={{
                borderRadius: 2,
                px: 2.5,
                color: "text.primary",
                borderColor: "rgba(16,24,40,0.06)",
                fontWeight: 600,
              }}
              startIcon={<OpenInNewIcon />}
            >
              View Profile
            </Button>
          </Stack>
        </Paper>

        {/* Centered stat cards with consistent size */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Box sx={{ width: "100%", maxWidth: 980 }}>
            <Grid container spacing={3} justifyContent="center" alignItems="stretch">
              <Grid item xs={12} sm={6} md="auto">
                <StatCard
                  icon={<PersonIcon />}
                  title="Profile"
                  value={user?.name || "—"}
                  subtitle={user?.email || ""}
                />
              </Grid>

              <Grid item xs={12} sm={6} md="auto">
                <StatCard
                  icon={<BoltIcon />}
                  title="Skills Have"
                  value={user?.skillsHave?.join(", ") || "N/A"}
                />
              </Grid>

              <Grid item xs={12} sm={6} md="auto">
                <StatCard
                  icon={<HandshakeIcon />}
                  title="Connections"
                  value={connections.length}
                  subtitle={`Free left: ${user?.freeConnectionLeft ?? 0}`}
                />
              </Grid>

              <Grid item xs={12} sm={6} md="auto">
                <Paper
                  elevation={1}
                  sx={{
                    width: STAT_WIDTH,
                    height: STAT_HEIGHT,
                    minHeight: STAT_HEIGHT,
                    borderRadius: 3,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    backgroundColor: "#fff",
                    boxShadow: "0 8px 28px rgba(16,24,40,0.06)",
                    px: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: "rgba(244,63,94,0.12)", color: "#ef4444", mb: 0.5 }}>
                    <ReportProblemIcon />
                  </Avatar>

                  <Typography variant="subtitle2" sx={{ color: MUTED, fontWeight: 600 }}>
                    Reports
                  </Typography>

                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {reportStats.reportCount}
                  </Typography>

                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                    {reportStats.isBanned ? "Account banned" : "Reports on your account"}
                  </Typography>

                  <Box sx={{ mt: 1, width: "80%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((reportStats.reportCount / reportStats.maxAllowedBeforeBan) * 100, 100)}
                      sx={{ height: 8, borderRadius: 2, mt: 1 }}
                    />
                    <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {reportStats.reportCount}/{reportStats.maxAllowedBeforeBan} reports
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            background: "#ffffff",
            boxShadow: "0 8px 28px rgba(16,24,40,0.06)",
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                  Suggested Connections
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                Matches based on your skills — connect, learn, and grow together.
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => navigate("/connections")}
              sx={{ textTransform: "none", color: PRIMARY }}
            >
              See all
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {!suggestions.length ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                No matches found yet. Update your skills or try again later.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {suggestions.map((s) => {
                const status = statuses[s._id] || "none";
                return (
                  <Grid item xs={12} sm={6} md={4} key={s._id}>
                    <Card
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        transition: "all 0.25s ease",
                        "&:hover": { transform: "translateY(-6px)", boxShadow: "0 14px 36px rgba(16,24,40,0.08)" },
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: MUTED, fontWeight: 700 }}>
                              {s.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                              {s.email}
                            </Typography>
                          </Box>

                          <Avatar sx={{ bgcolor: "rgba(11,117,201,0.12)", color: PRIMARY }}>
                            {s.name ? s.name[0].toUpperCase() : "U"}
                          </Avatar>
                        </Stack>

                        <Stack spacing={1} sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            <strong>Have:</strong> {s.skillsHave?.join(", ") || "N/A"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            <strong>Want:</strong> {s.skillsWant?.join(", ") || "N/A"}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.25} sx={{ mt: 2, justifyContent: "center" }}>
                          {status === "none" && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleConnect(s._id)}
                              sx={{
                                backgroundColor: PRIMARY,
                                "&:hover": { backgroundColor: "#0962a8" },
                                textTransform: "none",
                                borderRadius: 2,
                                px: 2.5,
                                fontWeight: 700,
                              }}
                            >
                              Connect
                            </Button>
                          )}

                          {status === "pending" && (
                            <Button
                              variant="outlined"
                              size="small"
                              disabled
                              sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                px: 2.5,
                                color: MUTED,
                                borderColor: "rgba(16,24,40,0.06)",
                              }}
                            >
                              Pending
                            </Button>
                          )}

                          {status === "received" && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleAccept(s._id)}
                                sx={{ textTransform: "none", borderRadius: 2, px: 2 }}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleReject(s._id)}
                                sx={{ textTransform: "none", borderRadius: 2, px: 2 }}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {status === "accepted" && (
                            <Button variant="contained" size="small" disabled sx={{ borderRadius: 2 }}>
                              Connected
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
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
