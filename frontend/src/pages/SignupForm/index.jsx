import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  Stepper,
  Step,
  Link,
  StepLabel,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const steps = ["Create Account", "Add Skills"];

const normalizeSkill = (skill) =>
  typeof skill === "string" ? skill.trim().toLowerCase() : "";

export default function SignupForm() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    skillsHave: "",
    skillsWant: "",
  });

  const [confirmError, setConfirmError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "skillsHave" || name === "skillsWant") {
      setFieldErrors((prev) => ({ ...prev, skillsHave: "", skillsWant: "" }));
    }
    if (name === "confirmPassword") {
      setConfirmError("");
    }
  };

  const validateStep0 = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Name is required";
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.fullName.trim())) {
      errors.fullName = "Name must contain only letters and spaces";
    }

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

    if (!formData.confirmPassword) {
      setConfirmError("Confirm password is required");
    } else if (formData.password !== formData.confirmPassword) {
      setConfirmError("Passwords do not match!");
    } else {
      setConfirmError("");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && !confirmError;
  };

  const handleNext = () => {
    const ok = validateStep0();
    if (!ok) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const validateSkillsStep = () => {
    const errors = {};
    const rawHave = formData.skillsHave.split(",");
    const rawWant = formData.skillsWant.split(",");

    const have = rawHave.map(normalizeSkill).filter((s) => s !== "");
    const want = rawWant.map(normalizeSkill).filter((s) => s !== "");

    if (have.length < 1 || have.length > 3) {
      errors.skillsHave = "You must provide 1 to 3 skills in 'skillsHave'";
    }
    if (want.length < 1 || want.length > 3) {
      errors.skillsWant = "You must provide 1 to 3 skills in 'skillsWant'";
    }

    if (!rawHave.every((skill) => typeof skill === "string" && skill.trim() !== "")) {
      errors.skillsHave =
        errors.skillsHave || "Each skill in 'skillsHave' must be a non-empty string";
    }
    if (!rawWant.every((skill) => typeof skill === "string" && skill.trim() !== "")) {
      errors.skillsWant =
        errors.skillsWant || "Each skill in 'skillsWant' must be a non-empty string";
    }

    if (new Set(have).size !== have.length) {
      errors.skillsHave = errors.skillsHave || "'skillsHave' contains duplicate skills";
    }
    if (new Set(want).size !== want.length) {
      errors.skillsWant = errors.skillsWant || "'skillsWant' contains duplicate skills";
    }

    const overlap = want.filter((s) => have.includes(s));
    if (overlap.length > 0) {
      const msg = `These skills cannot be in both 'skillsHave' and 'skillsWant': ${overlap.join(
        ", "
      )}`;
      errors.skillsHave = errors.skillsHave || msg;
      errors.skillsWant = errors.skillsWant || msg;
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const skillsOk = validateSkillsStep();
    if (!skillsOk) {
      toast.error("Please fix the skills errors before continuing.");
      return;
    }

    try {
      const res = await api.post("/auth/register", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        skillsHave: formData.skillsHave.split(","),
        skillsWant: formData.skillsWant.split(","),
      });

      toast.success(res.data.message || "Signup successful!");
      navigate("/verify-email", { state: { userId: res.data.userId } });
    } catch (err) {
      const data = err.response?.data;
      const errorsArr = Array.isArray(data?.errors) ? data.errors : [];

      if (errorsArr.length > 0) {
        const newErrors = {};
        errorsArr.forEach((er) => {
          const field = er.field || er.param;
          const msg = er.message || er.msg;
          if (!field || !msg) return;
          if (field === "name") newErrors.fullName = msg;
          else if (field === "skillsHave" || field === "skillsWant") {
            newErrors.skillsHave = msg;
            newErrors.skillsWant = msg;
          } else newErrors[field] = msg;
        });
        setFieldErrors((prev) => ({ ...prev, ...newErrors }));
        toast.error(
          errorsArr[0]?.message || errorsArr[0]?.msg || data?.message || "Signup failed"
        );
      } else {
        toast.error(data?.message || "Signup failed");
      }
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        bgcolor: "#f3f4f8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 0, md: 3 },
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "1200px",
          height: { xs: "100vh", md: "90vh" },
          borderRadius: { xs: 0, md: 4 },
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box
          sx={{
            flex: 1,
            position: "relative",
            color: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: { xs: 3, md: 5 },
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",

            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url('https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=1200')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.25,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(145deg, #2155ff 0%, #4f46e5 40%, #0ea5e9 100%)",
              opacity: 0.9,
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              gap: 4,
            }}
          >
            <Box>


              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.2,
                  color: "#ffffff",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Join SkillXchange
                <br />
                and Grow Together.
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  opacity: 1,
                  maxWidth: 420,
                  color: "#ffffff",
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  fontWeight: 500,
                }}
              >
                Match with people who have the skills you want and want the skills you
                already know. Practice, pair-program, mock interview, and level up
                together.
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  opacity: 1,
                  color: "#ffffff",
                  fontWeight: 600,
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                How SkillXchange Works
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                  mt: 1.5,
                  "@media (max-width: 900px)": {
                    gridTemplateColumns: "1fr",
                  },
                }}
              >
                {[
                  { step: "1", text: "Create your profile" },
                  { step: "2", text: "Match with learners" },
                  { step: "3", text: "Swap & grow together" },
                ].map((item) => (
                  <Box
                    key={item.step}
                    sx={{
                      p: 2,
                      borderRadius: "14px",
                      bgcolor: "rgba(15, 23, 42, 0.35)",
                      border: "1px solid rgba(226, 232, 240, 0.2)",
                      backdropFilter: "blur(8px)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 22,
                        fontWeight: 800,
                        mb: 0.5,
                        background: "linear-gradient(135deg,#fff,#c7d2fe)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {item.step}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 1,
                        color: "#ffffff",
                        fontWeight: 500,
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>


            </Box>


            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  mb: 1,
                  fontSize: 11,
                  opacity: 1,
                  color: "#ffffff",
                  fontWeight: 600,
                  textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                Trusted by learners like you
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: "rgba(15, 23, 42, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }}
                >
                  JS
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "#ffffff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    "I swapped my React skills for DSA guidance. It felt like a
                    dedicated study buddy — but smarter."
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 1,
                      color: "#ffffff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  >
                    – SkillXchange user
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>


        <Box
          sx={{
            flex: 1.1,
            bgcolor: "#ffffff",
            p: { xs: 3, md: 4 },
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              gap: 2,
            }}
          >
          </Box>

          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{
              mb: 3,
              "& .MuiStepIcon-root": {
                color: "#d0d5dd",
                "&.Mui-active": { color: "#2155ff" },
                "&.Mui-completed": { color: "#2155ff" },
              },
              "& .MuiStepConnector-root .MuiStepConnector-line": {
                borderColor: "#d0d5dd",
              },
              "& .MuiStepLabel-label": {
                color: "text.secondary",
                fontWeight: 500,
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: "#374151",
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Become part of a community where your skills inspire progress —
            while the brilliance of others fuels your own.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {step === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!fieldErrors.fullName}
                  helperText={fieldErrors.fullName}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
                />

                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!fieldErrors.email}
                  helperText={fieldErrors.email}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
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

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!confirmError}
                  helperText={confirmError}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          edge="end"
                          size="small"
                          aria-label={
                            showConfirmPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  onClick={handleNext}
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.4,
                    fontSize: "1rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2155ff, #4f46e5)",
                    textTransform: "none",
                    boxShadow: "0 8px 20px rgba(33, 85, 255, 0.25)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1645cc, #4338ca)",
                      boxShadow: "0 10px 26px rgba(33, 85, 255, 0.35)",
                    },
                  }}
                >
                  Next
                </Button>

                <Box
                  sx={{
                    mt: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      mb: 1,
                      fontWeight: 500,
                    }}
                  >
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      underline="hover"
                      sx={{ color: "#0B75C9", fontWeight: 600 }}
                    >
                      Log in
                    </Link>
                  </Typography>

                </Box>

              </Box>
            )}

            {step === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  label="Skills Have (comma separated)"
                  name="skillsHave"
                  value={formData.skillsHave}
                  onChange={handleChange}
                  fullWidth
                  error={!!fieldErrors.skillsHave}
                  helperText={fieldErrors.skillsHave}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
                />

                <TextField
                  label="Skills Want (comma separated)"
                  name="skillsWant"
                  value={formData.skillsWant}
                  onChange={handleChange}
                  fullWidth
                  error={!!fieldErrors.skillsWant}
                  helperText={fieldErrors.skillsWant}
                  size="small"
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#1f2937",
                      fontWeight: 500,
                    },
                    "& .MuiInputLabel-root": {
                      color: "#6b7280",
                      fontWeight: 500,
                    },
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    mt: 2,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    fullWidth
                    sx={{
                      py: 1.4,
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderRadius: 1,
                      textTransform: "none",
                      color: "#374151",
                      borderColor: "#d1d5db",
                      "&:hover": {
                        borderColor: "#9ca3af",
                        backgroundColor: "#f9fafb",
                      },
                    }}
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.4,
                      fontSize: "1rem",
                      fontWeight: 700,
                      borderRadius: 1,
                      backgroundColor: "#2155ff",
                      textTransform: "none",
                      "&:hover": { backgroundColor: "#1645cc" },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}