import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },          // optional, future use
    password: { type: String },                        // normal login users
    googleId: { type: String, unique: true, sparse: true }, // Google login users
    bio: { type: String, default: "Hey there! I am using Pingup" },
    profile_picture: { type: String, default: '' },
    cover_photo: { type: String, default: '' },
    location: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    password_otp: {
        otp: { type: String },
        send_time: { type: Date },
        limit: { type: Number, default: 5 },
        last_attempt: { type: Object },
    },
    role: { type: String, enum: ['user']}
}, {
    timestamps: true,
    minimize: false
});

const User = mongoose.model('User', userSchema);

export default User;

