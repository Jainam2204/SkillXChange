# SkillXChange Platform

A modern skill exchange platform that connects users based on complementary skills. Users can list skills they have and skills they want to learn, find matching connections, engage in real-time chat, schedule video meetings, and manage subscriptions.

![SkillXChange](https://img.shields.io/badge/SkillXChange-Platform-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-19+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## 🚀 Features

### Core Functionality
- **Skill Matching**: Intelligent algorithm to match users based on complementary skills
- **Real-time Chat**: Instant messaging with Socket.IO for seamless communication
- **Video Meetings**: Integrated WebRTC-based video conferencing for skill exchange sessions
- **User Authentication**: Secure JWT-based authentication with email verification
- **Connection Management**: Send, accept, and manage connection requests
- **Subscription Plans**: Multiple subscription tiers with payment integration
- **User Reporting**: Reporting system for moderation and safety

### Technical Features
- **Real-time Updates**: WebSocket-based real-time notifications and messaging
- **File Uploads**: Cloudinary integration for media storage and CDN delivery
- **Rate Limiting**: Multi-tier rate limiting for API protection
- **Security**: Helmet security headers, CORS protection, input validation
- **Logging**: Structured logging with Winston
- **Error Handling**: Comprehensive error handling and validation

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time WebSocket server
- **JWT** - Authentication
- **Winston** - Logging
- **Express-validator** - Input validation
- **Helmet** - Security headers
- **Express-rate-limit** - Rate limiting

### External Services
- **Cloudinary** - Media storage and CDN
- **Brevo (Sendinblue)** - Email service
- **MongoDB Atlas** - Database hosting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **MongoDB Atlas** account (or local MongoDB instance)
- **Cloudinary** account
- **Brevo** account (for email service)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd IT-643
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=your_verified_email@example.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Logging
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Start Backend

```bash
cd backend
npm start
```

## 📁 Project Structure

```
IT-643/
├── backend/
│   ├── config/           # Configuration files
│   │   ├── cloudinary.js
│   │   ├── cors.js
│   │   ├── db.js
│   │   ├── emailConfig.js
│   │   ├── helmet.js
│   │   └── razorpay.js
│   ├── controllers/      # Route controllers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── connectioncontroller.js
│   │   ├── meetingController.js
│   │   ├── messageController.js
│   │   ├── reportController.js
│   │   ├── subscriptioncontroller.js
│   │   └── userController.js
│   ├── middleware/       # Custom middleware
│   │   ├── authMiddleware.js
│   │   ├── checkBanned.js
│   │   ├── errorhandler.js
│   │   ├── rateLimiter.js
│   │   └── upload.js
│   ├── models/           # Mongoose models
│   │   ├── ConnectionRequest.js
│   │   ├── Meeting.js
│   │   ├── Message.js
│   │   ├── Report.js
│   │   ├── Subscription.js
│   │   └── User.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── connect.js
│   │   ├── meeting.js
│   │   ├── messages.js
│   │   ├── report.js
│   │   ├── subscription.js
│   │   └── user.js
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   ├── connection.js
│   │   ├── messageService.js
│   │   ├── realtime.js
│   │   ├── reportService.js
│   │   ├── Subscription.js
│   │   └── userService.js
│   ├── templates/        # Email templates
│   │   └── emailStrategies.js
│   ├── test/             # Test files
│   ├── utils/            # Utility functions
│   │   ├── logger.js
│   │   ├── sendEmail.js
│   │   ├── Subscriptioncron.js
│   │   ├── validateEnv.js
│   │   └── validators.js
│   ├── app.js            # Express app configuration
│   ├── server.js         # Server entry point
│   └── socket.js         # Socket.IO configuration
│
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   ├── ChatArea.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── UserList.jsx
│   │   │   └── ...
│   │   ├── context/      # React contexts
│   │   │   └── NotificationContext.jsx
│   │   ├── hooks/        # Custom hooks
│   │   │   └── useAuth.js
│   │   ├── pages/        # Page components
│   │   │   ├── Chat/
│   │   │   ├── Dashboard/
│   │   │   ├── login/
│   │   │   ├── Meet/
│   │   │   └── ...
│   │   ├── services/     # API services
│   │   │   └── socket.js
│   │   ├── theme/        # MUI theme
│   │   │   └── theme.js
│   │   ├── utils/        # Utility functions
│   │   │   └── api.js
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   └── vite.config.js
│
├── docs/                 # Documentation
│   ├── skillxchange_class_diagram.pdf
│   └── Updated_design_document.pdf
│
├── design.md             # Design documentation
└── README.md             # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify email

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/:id` - Get user by ID

### Connections
- `GET /api/connect/suggestions` - Get connection suggestions
- `POST /api/connect/request` - Send connection request
- `PUT /api/connect/accept/:id` - Accept connection request
- `DELETE /api/connect/reject/:id` - Reject connection request

### Messages
- `GET /api/messages/:conversationId` - Get messages for conversation
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

### Chat
- `GET /api/chat/connections` - Get chat connections
- `GET /api/chat/conversations` - Get user conversations

### Meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `DELETE /api/meetings/:id` - Delete meeting

### Subscriptions
- `GET /api/subscription/plans` - Get subscription plans
- `POST /api/subscription/subscribe` - Subscribe to plan
- `GET /api/subscription/status` - Get subscription status

### Reports
- `POST /api/report` - Report user

### Health Check
- `GET /api/health` - Health check endpoint

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Running Specific Tests

```bash
npm test -- auth.integration.test.js
```

## 🔒 Security Features

- **Rate Limiting**: Multi-tier rate limiting (API, Auth, Upload)
- **Security Headers**: Helmet middleware for security headers
- **CORS Protection**: Environment-specific CORS configuration
- **Input Validation**: Express-validator with custom strategies
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password hashing
- **HTTP-only Cookies**: Secure cookie storage for tokens

## 📝 Logging

The application uses Winston for structured logging:

- **Development**: Console logging with colors
- **Production**: JSON format for log aggregation
- **Log Files**: Stored in `backend/logs/`
  - `combined.log` - All logs
  - `error.log` - Error logs only

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- Check if MongoDB connection string is correct
- Verify all environment variables are set
- Check if port 5000 is available

#### Frontend can't connect to backend
- Verify `VITE_API_URL` in frontend `.env` matches backend URL
- Check CORS configuration in backend
- Ensure backend server is running

#### Socket.IO connection fails
- Check if Socket.IO server is initialized
- Verify JWT token is valid
- Check browser console for connection errors

#### Email not sending
- Verify Brevo API key is correct
- Check if sender email is verified in Brevo
- Review email service logs

## 📚 Documentation

- **Design Document**: See [design.md](./design.md) for detailed architecture and design decisions
- **Frontend Improvements**: See [frontend/DESIGN_IMPROVEMENTS.md](./frontend/DESIGN_IMPROVEMENTS.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- SkillXChange Development Team

## 🙏 Acknowledgments

- Material-UI for the component library
- Socket.IO for real-time communication
- MongoDB Atlas for database hosting
- Cloudinary for media storage
- Brevo for email services

## 📞 Support

For support, email support@skillxchange.com or open an issue in the repository.

---

**Made with ❤️ by the SkillXChange Team**

