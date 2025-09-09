const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    message: { 
        type: String, 
    },
    fileUrl: { 
        type: String
    },
    fileName: {  
        type: String
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
  },
  { timestamps: true } 
);

module.exports = mongoose.model("MessageTemp", messageSchema);