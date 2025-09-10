

import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const verifyOtp = async (req, res, next) => {
    const { otp } = req.body;

    if (!otp) {
        return res.status(400).json({ message: "Please enter the OTP code", status: false });
    }

    try {
        // Find user by OTP
        const findedUser = await User.findOne({ 'password_otp.otp': otp });

        if (!findedUser) {
            return res.status(400).json({ message: 'Invalid OTP code. Please try again', status: false });
        }

        // Check if password_otp exists
        if (!findedUser.password_otp) {
            return res.status(500).json({ message: 'Something went wrong. Please try again', status: false });
        }

        // OTP expiry check (5 minutes)
        const expiryTime = new Date(findedUser.password_otp.send_time).getTime() + 5 * 60 * 1000;  
        const now = Date.now();

        if (now > expiryTime) {
            return res.status(400).json({ message: 'OTP code has expired. Please request a new one', status: false });
        }

        // Safe token generation
        let emailForToken = findedUser.email;
        if (!emailForToken) {
            emailForToken = findedUser._id.toString();
        }

        const accessToken = generateToken(emailForToken);

        // Set cookie
        res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax' });

        // Clear OTP safely
        if (findedUser.password_otp.otp) {
            findedUser.password_otp.otp = null;
            await findedUser.save();
        }

        return res.status(200).json({ 
            message: 'OTP verified', 
            status: true,
            user: {
                _id: findedUser._id,
                email: findedUser.email
            }
        });

    } catch (error) {
        next(error);
    }
};

export default verifyOtp;
