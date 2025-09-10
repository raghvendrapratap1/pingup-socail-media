import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";


const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
      status: false
    });
  }

  try {
    // Check database connection status
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState !== 1) {
      return res.status(500).json({
        message: 'Database connection error',
        status: false
      });
    }

    // Try to find the user
    const findedUser = await User.findOne({ email: email });
    
    if (!findedUser) {
      return res.status(400).json({
        message: 'No user found with this email',
        status: false
      });
    }

    // Check if user has a password (for Google users who might not have passwords)
    if (!findedUser.password) {
      return res.status(400).json({
        message: 'This account was created with Google. Please use Google login.',
        status: false
      });
    }

    const isPassMatch = await bcrypt.compare(password, findedUser.password);
    if (!isPassMatch) {
      return res.status(400).json({
        message: "Incorrect password",
        status: false
      });
    }

    // Check if ACCESS_TOKEN_KEY exists
    if (!process.env.ACCESS_TOKEN_KEY) {
      return res.status(500).json({
        message: 'Server configuration error',
        status: false
      });
    }

    // Generate token using updated generateToken
    const accessToken = generateToken(findedUser);
    
    // Save token in cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });

    res.status(200).json({
      message: 'Login successful',
      status: true,
      user: {
        id: findedUser._id,
        email: findedUser.email,
        full_name: findedUser.full_name
      }
    });

  } catch (error) {
    next(error);
  }
};

export default login;

