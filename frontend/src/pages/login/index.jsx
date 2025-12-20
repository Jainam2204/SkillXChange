import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Link,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

export default function LoginForm({ setUser }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (
      !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,14}$/.test(
        formData.password
      )
    ) {
      errors.password =
        "Password must be 6-14 chars, include uppercase, lowercase, digit, and special character (@$!%*?&)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const res = await api.post("/auth/login", formData);
      const user = res.data.user;

      localStorage.setItem("user", JSON.stringify(user));
      if (setUser) setUser(user);

      toast.success(res.data.message || "Login successful!");
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 403 || (data?.isVerified === false && data?.user?._id)) {
        toast.warn(data?.message || "Please verify your email");
        navigate("/verify-email", {
          state: { userId: data?.user?._id },
        });
        return;
      }

      toast.error(data?.message || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
          <Box sx={{ textAlign: "center", mb: 4 }}>
               <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  WebkitBackgroundClip: "text",
                  mb: 1,
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontSize: "1rem" }}
              >
                Sign in to continue to SkillXChange
              </Typography>
            </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>

            <TextField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              size="small"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
            
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                size="small"
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />          


            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.3,
                fontSize: "1rem",
                fontWeight: 700,
                borderRadius: 1,
                textTransform: "none",
                backgroundColor: "#0B75C9",
                "&:hover": { backgroundColor: "#0962a8" },
              }}
            >
              Sign in
            </Button>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  underline="hover"
                  sx={{ color: "#0B75C9", fontWeight: 600 }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
