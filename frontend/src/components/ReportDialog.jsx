import React, { useState } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

function ReportUserDialog({
  open,
  onClose,
  reporterId,
  reportedUserId,
  reportedUserName,
  hasReported,
  setHasReported,
}) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    try {
      // Basic front-end validation
      if (!reporterId || !reportedUserId || !reason) {
        toast.error("Reporter, reported user and reason are required.");
        console.error("Report data missing:", {
          reporterId,
          reportedUserId,
          reason,
        });
        return;
      }

      const res = await api.post("/report", {
        reporterId,
        reportedUserId,
        reason,
      });

      if (res.status === 200) {
        toast.success("Report submitted successfully!");
        setHasReported?.(true);
      }

      setReason("");
      handleClose();
    } catch (error) {
      console.error("Full report error:", error.response || error);

      const status = error.response?.status;
      const message =
        error.response?.data?.message || "Something went wrong.";

      if (status === 400) {
        toast.error(message);
        if (message.toLowerCase().includes("already reported")) {
          setHasReported?.(true);
        }
      } else if (status === 403) {
        toast.error("You cannot report yourself.");
      } else {
        toast.error("Failed to submit report. Please try again later.");
      }

      console.error("Error submitting report:", message);
    }
  };

  const disabled = !reason || hasReported;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Report {reportedUserName}</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Please select a reason for reporting this user.
        </Typography>

        <FormControl fullWidth size="small">
          <InputLabel id="report-reason-label">Reason</InputLabel>
          <Select
            labelId="report-reason-label"
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <MenuItem value="">
              <em>Select a reason</em>
            </MenuItem>
            <MenuItem value="Spam">Spam</MenuItem>
            <MenuItem value="Inappropriate behavior">
              Inappropriate behavior
            </MenuItem>
            <MenuItem value="Fake account">Fake account</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        {hasReported && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            You have already reported this user.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="error"
          variant="contained"
          disabled={disabled}
        >
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReportUserDialog;
