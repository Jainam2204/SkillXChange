import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import CodeIcon from "@mui/icons-material/Code";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PRIMARY_COLOR = "#0B75C9";
const LIGHT_BLUE_BG = "#eaf7ff";
const TEXT_COLOR = "#1e293b";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    skillsHave: "",
    skillsWant: "",
  });

  // fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
        setFormData({
          name: res.data.name || "",
          skillsHave: res.data.skillsHave?.join(", ") || "",
          skillsWant: res.data.skillsWant?.join(", ") || "",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Session expired. Please login again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user?._id) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        skillsHave: formData.skillsHave
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        skillsWant: formData.skillsWant
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const res = await api.put(`/user/update-profile/${user._id}`, payload);
      toast.success("Profile updated successfully!");
      setUser(res.data);
      setOpenEdit(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          backgroundColor: LIGHT_BLUE_BG,
          p: 2,
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user) return null;

  const formattedJoinDate = new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      {/* Page background + center */}
      <Box sx={{ backgroundColor: LIGHT_BLUE_BG, minHeight: "100vh", py: 6 }}>
        <Container maxWidth="lg">
          {/* HERO SECTION */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
              Your Profile
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, maxWidth: 800, mx: "auto" }}>
              Keep your skills up to date so we can match you with the right people. Update your profile to improve
              suggestions and find relevant exchanges.
            </Typography>
          </Box>

          {/* Centered card */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={4}
              sx={{
                width: "100%",
                maxWidth: 980,
                borderRadius: 3,
                p: { xs: 3, md: 5 },
                backgroundColor: "#fff",
                boxShadow: "0 12px 40px rgba(16,24,40,0.08)",
                position: "relative",
                mx: "auto",
              }}
            >
              {/* Edit button top-right (circular) */}
              <IconButton
                onClick={() => setOpenEdit(true)}
                sx={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  backgroundColor: PRIMARY_COLOR,
                  color: "#fff",
                  "&:hover": { backgroundColor: "#0962a8" },
                  width: 44,
                  height: 44,
                }}
                aria-label="edit profile"
              >
                <EditIcon />
              </IconButton>

              {/* top center avatar, name, email */}
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Avatar
                  sx={{
                    width: 96,
                    height: 96,
                    fontSize: "2.25rem",
                    backgroundColor: PRIMARY_COLOR,
                    color: "#fff",
                    mx: "auto",
                    mb: 1,
                    fontWeight: 700,
                  }}
                >
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </Avatar>

                <Typography variant="h5" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                  {user.name}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 16, color: "#64748b" }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Grid layout: center horizontally and vertically */}
              <Grid container spacing={4} alignItems="center" justifyContent="center">
                {/* LEFT: joined + connections + skills have + skills want */}
                <Grid
                  item
                  xs={12}
                  md={7}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    maxWidth: 650,
                    mx: "auto",
                  }}
                >
                  <Stack spacing={3}>
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CalendarTodayIcon sx={{ color: "#64748b", fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Joined {formattedJoinDate}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <GroupIcon sx={{ color: "#64748b", fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Connections Left: {user.freeConnectionLeft ?? 0}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider />

                    {/* Skills I Offer */}
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: TEXT_COLOR, fontWeight: 700, mb: 1 }}>
                        <Box component="span" sx={{ verticalAlign: "middle", mr: 1 }}>
                          <CodeIcon sx={{ color: PRIMARY_COLOR }} />
                        </Box>
                        Skills I Offer
                      </Typography>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                        {user.skillsHave?.length ? (
                          user.skillsHave.map((skill, i) => (
                            <Chip
                              key={i}
                              label={skill}
                              size="small"
                              sx={{
                                backgroundColor: "#e6f2ff",
                                color: PRIMARY_COLOR,
                                fontWeight: 600,
                                borderRadius: 1,
                                px: 1,
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: "#64748b", fontStyle: "italic" }}>
                            No skills added.
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" sx={{ color: TEXT_COLOR, fontWeight: 700, mb: 1 }}>
                        <Box component="span" sx={{ verticalAlign: "middle", mr: 1 }}>
                          <SchoolIcon sx={{ color: PRIMARY_COLOR }} />
                        </Box>
                        Skills I’m Seeking
                      </Typography>

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                        {user.skillsWant?.length ? (
                          user.skillsWant.map((skill, i) => (
                            <Chip
                              key={i}
                              label={skill}
                              size="small"
                              sx={{
                                backgroundColor: "#e6f2ff",
                                color: PRIMARY_COLOR,
                                fontWeight: 600,
                                borderRadius: 1,
                                px: 1,
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" sx={{ color: "#64748b", fontStyle: "italic" }}>
                            No learning goals defined.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={4}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 320,
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: "#fafafa",
                      border: "1px solid rgba(0,0,0,0.04)",
                      boxShadow: "0 6px 18px rgba(16,24,40,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: TEXT_COLOR, fontWeight: 700 }}>
                      Account Status
                    </Typography>

                    <Box>
                      <Typography
                        variant="body1"
                        sx={{ color: TEXT_COLOR, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CheckCircleIcon color={user.isVerified ? "success" : "disabled"} />
                        {user.isVerified ? "Verified" : "Unverified"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Email & identity
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {user.freeConnectionLeft ?? 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Free matches remaining
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate("/dashboard")}
                      sx={{
                        textTransform: "none",
                        backgroundColor: PRIMARY_COLOR,
                        "&:hover": { backgroundColor: "#0962a8" },
                        borderRadius: 2,
                        mt: 1,
                        py: 1.25,
                      }}
                    >
                      Find Skill Matches
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: TEXT_COLOR }}>Update Profile</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            variant="outlined"
          />
          <TextField
            label="Skills Have (comma separated)"
            fullWidth
            value={formData.skillsHave}
            onChange={(e) => setFormData({ ...formData, skillsHave: e.target.value })}
            placeholder="e.g., React, JavaScript, Python"
            helperText="What you can teach."
            variant="outlined"
          />
          <TextField
            label="Skills Want (comma separated)"
            fullWidth
            value={formData.skillsWant}
            onChange={(e) => setFormData({ ...formData, skillsWant: e.target.value })}
            placeholder="e.g., Node.js, TypeScript, AWS"
            helperText="What you want to learn."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEdit(false)} sx={{ textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            variant="contained"
            disabled={saving}
            sx={{
              textTransform: "none",
              backgroundColor: PRIMARY_COLOR,
              "&:hover": { backgroundColor: "#0962a8" },
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
