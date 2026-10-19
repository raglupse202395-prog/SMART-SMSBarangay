const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema ({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: false, trim: true},
    role: {
        type: String,
        enum: ["superadmin", "captain", "secretary", "treasurer", "sk_chairman", "bhw", "admin"],
        default: "admin"
    },
    fullname: { type: String, required: true },
    phoneNumber: { type: String, required: true },
});

module.exports = mongoose.model("Admin", UserSchema);