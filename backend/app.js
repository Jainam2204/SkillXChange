const express = require("express");
const cors = require("cors");
const upload = require("./middleware/upload");
const uploadController = require("./controllers/uploadController");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const subscriptionRoutes = require("./routes/subscription");
const meetRoutes = require("./routes/meeting");
const messageRoutes = require("./routes/message");
const recommendVideos = require("./controllers/recommendChannelVideos");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("API is Running"));
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/api/meet", meetRoutes);
app.use("/messages", messageRoutes);
app.use("/recommend-channel-videos", recommendVideos);

app.use("/uploads", express.static("uploads"));

app.post("/upload", upload.single("file"), uploadController.uploadFile);

module.exports = app;