import React, { useMemo } from "react";
import { Box, Container, Paper, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const BannedPage = () => {
  const navigate = useNavigate();

  const userEmail = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.email || null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    // just to be safe, clear everything
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f7f9fb, #eef5f1)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Account Restricted
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 2 }}
          >
            To keep SkillXchange safe and respectful for everyone, some
            accounts may be restricted when they receive multiple reports.
          </Typography>

          {userEmail && (
            <Typography sx={{ mb: 2 }}>
              The account associated with{" "}
              <strong>{userEmail}</strong> has been{" "}
              <strong>banned</strong>.
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 3 }}
          >
            If you believe this is a mistake, you can contact our support team
            with your registered email.  
            You can also continue using the platform with a different account.
          </Typography>

          <Button
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 3, px: 4, mb: 1 }}
            onClick={handleLogout}
          >
            Login with another account
          </Button>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 1 }}
          >
            Thank you for understanding and helping us keep the community
            healthy 💚
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default BannedPage;
