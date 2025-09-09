const dotenv = require("dotenv");
const { createServer } = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const initSocket = require("./utils/socket");

dotenv.config();
connectDB();

const server = createServer(app);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));