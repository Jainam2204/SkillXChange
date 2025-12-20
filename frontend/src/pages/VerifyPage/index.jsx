import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = location.state || {};

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (!userId) {
    navigate("/signup");
  }

  const handleCodeChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 6 digits
    if (value === "" || /^\d+$/.test(value)) {
      if (value.length <= 6) {
        setCode(value);
        setError("");
      }
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Verification code is required");
      return;
    }
    if (code.length !== 6) {
      setError("Verification code must be exactly 6 digits");
      return;
    }
    if (!/^\d+$/.test(code)) {
      setError("Verification code must contain only digits");
      return;
    }
    try {
      await api.post("/auth/verify", {
        userId,
        verificationCode: code,
      });

      toast.success("Email verified! You can now login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      navigate("/signup");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#eaf7ff",
        p: 2,
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: "420px",
            maxWidth: "100%",
            p: { xs: 4, sm: 5 },
            borderRadius: 2,
            backgroundColor: "#ffffff",
            boxShadow: "0 12px 30px rgba(16, 24, 40, 0.08)",
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700, color: "#0f1724" }}
          >
            Verify Your Email
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{
              mb: 3,
              color: "text.secondary",
              maxWidth: "90%",
              mx: "auto",
            }}
          >
            Enter the verification code sent to your email.
          </Typography>

          <TextField
            placeholder="Enter 6-digit verification code"
            value={code}
            onChange={handleCodeChange}
            fullWidth
            margin="normal"
            size="small"
            error={!!error}
            helperText={error}
            inputProps={{
              maxLength: 6,
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.3,
              fontSize: "1rem",
              fontWeight: 700,
              borderRadius: 1,
              backgroundColor: "#0B75C9",
              textTransform: "none",
              "&:hover": { backgroundColor: "#0962a8" },
            }}
            onClick={handleVerify}
          >
            Confirm
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
