import React from "react";
import { Box, Typography, Link, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

function MessageBubble({ message, isOwnMessage }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFile = message.type === "file" && message.fileUrl;
  const isPDF = message.fileName?.toLowerCase().endsWith(".pdf");
  const fileExtension = message.fileName?.split(".").pop()?.toLowerCase() || "";

  const handleFileDownload = (e) => {
    e.preventDefault();

    if (message._id) {
      const downloadUrl = `/api/messages/download/${message._id}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = message.fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    if (isPDF) return "📄";
    if (["doc", "docx"].includes(fileExtension)) return "📝";
    if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) return "🖼️";
    return "📎";
  };

  return (
    <Box
      display="flex"
      justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
      my={1}
    >
      <Box
        sx={{
          maxWidth: "70%",
          px: 2,
          py: 1.5,
          borderRadius: 2,
          wordBreak: "break-word",
          bgcolor: isOwnMessage ? "#1976d2" : "#ffffff",
          color: isOwnMessage ? "#ffffff" : "#1e293b",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
        }}
      >
        {isFile ? (
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <span style={{ fontSize: "1.2rem" }}>{getFileIcon()}</span>
              <Typography
                variant="body2"
                sx={{
                  color: isOwnMessage ? "#ffffff" : "#1e293b",
                  fontWeight: 500,
                }}
              >
                {message.fileName || "File"}
              </Typography>
            </Box>
            {message.content && message.content !== message.fileName && (
              <Typography
                variant="body2"
                sx={{
                  color: isOwnMessage ? "rgba(255,255,255,0.9)" : "#64748b",
                }}
              >
                {message.content}
              </Typography>
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleFileDownload}
              sx={{
                textTransform: "none",
                borderRadius: 1,
                backgroundColor: isOwnMessage ? "#ffffff" : "#1976d2",
                color: isOwnMessage ? "#1976d2" : "#ffffff",
                "&:hover": {
                  backgroundColor: isOwnMessage ? "#f5f5f5" : "#1565c0",
                },
              }}
            >
              Download File
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: isOwnMessage ? "#ffffff" : "#1e293b" }}>
            {message.content}
          </Typography>
        )}

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            textAlign: "right",
            color: isOwnMessage ? "rgba(255,255,255,0.8)" : "#64748b",
            fontSize: "0.75rem",
          }}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  );
}

export default MessageBubble;