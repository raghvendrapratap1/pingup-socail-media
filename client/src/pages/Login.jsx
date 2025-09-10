import React, { useState } from "react";
import {
  TextField,
  Button,
  Divider,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Google,
  MailOutline,
  LockOutlined,
  ArrowBack,
  Send,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";
import { fetchConnections } from "../features/connections/connectionsSlice";
import httpAction from "../utils/httpAction";
import apis from "../utils/apis";
import toast from "react-hot-toast";
import { RiLoginCircleFill } from "react-icons/ri";
import { IoPersonAddSharp } from "react-icons/io5";
import { GrPowerReset } from "react-icons/gr";
import { MdOutlineVerified } from "react-icons/md";
import { RxUpdate } from "react-icons/rx";

// Authentication modes
const AUTH_MODES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT_PASSWORD: 'forgot_password',
  OTP_VERIFY: 'otp_verify',
  UPDATE_PASSWORD: 'update_password'
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [authMode, setAuthMode] = useState(AUTH_MODES.LOGIN);
  const [visible, setVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'text-red-500';
    if (passwordStrength <= 3) return 'text-yellow-500';
    if (passwordStrength <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  // Countdown timer effect for OTP
  React.useEffect(() => {
    let interval = null;
    
    if (authMode === AUTH_MODES.OTP_VERIFY && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, authMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Login form
  const loginInitialState = { email: "", password: "" };
  const loginValidationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "At least 6 characters")
      .required("Password is required"),
  });

  const handleLoginSubmit = async (values) => {
    try {
      const data = {
        url: apis().loginUser,
        method: "POST",
        body: values,
      };

      const result = await httpAction(data);
      if (result?.status) {
        toast.success(result?.message || "Login successful");
        dispatch(fetchUser());
        dispatch(fetchConnections());
        navigate("/", { replace: true });
      } else {
        toast.error(result?.message || "Login failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

  // Register form
  const registerInitialState = {
    full_name: '',
    email: '',
    password: '',
    terms: false
  };

  const registerValidationSchema = Yup.object({
    full_name: Yup.string()
      .required('Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
      .matches(/^[a-zA-Z]/, 'Name must start with a letter')
      .matches(/[a-zA-Z]$/, 'Name must end with a letter')
      .test('no-consecutive-spaces', 'Name cannot have consecutive spaces', value => 
        !/\s{2,}/.test(value)
      )
      .test('no-leading-trailing-spaces', 'Name cannot start or end with spaces', value => 
        !/^\s|\s$/.test(value)
      )
      .trim(),
    email: Yup.string()
      .required('Email is required')
      .email('Please enter a valid email address')
      .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email format')
      .max(254, 'Email cannot exceed 254 characters')
      .test('no-consecutive-dots', 'Email cannot have consecutive dots', value => 
        !/\.{2,}/.test(value)
      )
      .test('valid-domain', 'Please enter a valid domain', value => {
        if (!value) return false;
        const domain = value.split('@')[1];
        return domain && domain.length >= 2 && !domain.startsWith('.') && !domain.endsWith('.');
      })
      .lowercase()
      .trim(),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
      .test('no-consecutive-chars', 'Password cannot have 4+ consecutive characters (like 1234, abcd)', value => {
        if (!value) return false;
        for (let i = 0; i < value.length - 3; i++) {
          if (value.charCodeAt(i) + 1 === value.charCodeAt(i + 1) && 
              value.charCodeAt(i + 1) + 1 === value.charCodeAt(i + 2) &&
              value.charCodeAt(i + 2) + 1 === value.charCodeAt(i + 3)) {
            return false;
          }
        }
        return true;
      })
      .test('no-common-patterns', 'Password is too common or predictable', value => {
        if (!value) return false;
        const commonPatterns = [
          'password', '123456', 'qwerty', 'abc123', 'password123',
          'admin', 'letmein', 'welcome', 'monkey', 'dragon'
        ];
        return !commonPatterns.some(pattern => 
          value.toLowerCase().includes(pattern)
        );
      }),
    terms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions')
  });

  const handleRegisterSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      setSubmitting(true);
      const { terms, ...apiData } = values;
      
      const data = {
        url: apis().registerUser,
        method: 'POST',
        body: apiData
      };

      const result = await httpAction(data);
      if (result?.status) {
        toast.success(result?.message || "Registration successful");
        resetForm();
        setAcceptedTerms(false);
        setPasswordStrength(0);
        setAuthMode(AUTH_MODES.LOGIN);
      } else {
        toast.error(result?.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot Password form
  const forgotPasswordInitialState = { email: '' };
  const forgotPasswordValidationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
  });

  const handleForgotPasswordSubmit = async (values) => {
    try {
      setLoading(true);
      const data = {
        url: apis().forgotPassword,
        method: 'POST',
        body: { email: values.email },
      };

      const result = await httpAction(data);
      if (result?.status) {
        toast.success(result?.message);
        localStorage.setItem('email', values.email);
        setAuthMode(AUTH_MODES.OTP_VERIFY);
        setTimeLeft(60);
        setCanResend(false);
      } else {
        toast.error(result?.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // OTP Verify form
  const otpInitialState = {
    otp1: '', otp2: '', otp3: '', otp4: '', otp5: '', otp6: ''
  };
  const otpValidationSchema = Yup.object({
    otp1: Yup.string().required(''),
    otp2: Yup.string().required(''),
    otp3: Yup.string().required(''),
    otp4: Yup.string().required(''),
    otp5: Yup.string().required(''),
    otp6: Yup.string().required('')
  });

  const handleOtpSubmit = async (values) => {
    const otp = values.otp1 + values.otp2 + values.otp3 + values.otp4 + values.otp5 + values.otp6;

    const data = {
      url: apis().verifyOtp,
      method: "POST",
      body: { otp: otp, email: localStorage.getItem("email") }
    };

    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result.message);
      setAuthMode(AUTH_MODES.UPDATE_PASSWORD);
    } else {
      toast.error(result?.message || "Something went wrong");
    }
  };

  const otpArray = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'];

  const inputChange = (value, setFieldValue, index, item) => {
    setFieldValue(item, value);
    if (value && index < 6) {
      const nextElement = document.getElementById(index + 1);
      nextElement?.focus();
    }
  };

  const resendOtp = async () => {
    if (!canResend || isResending) return;

    try {
      setIsResending(true);
      const data = {
        url: apis().forgotPassword,
        method: "POST",
        body: { email: localStorage.getItem("email") },
      };

      const result = await httpAction(data);
      
      // 🔍 DEBUG: Show OTP in browser console (remove in production)
      if (result?.debug_otp) {
        console.log("🔄 RESEND OTP RECEIVED:", result.debug_otp);
        console.log("🔄 RESEND OTP RECEIVED:", result.debug_otp);
        console.log("🔄 RESEND OTP RECEIVED:", result.debug_otp);
        console.log("📱 Use this OTP to verify:", result.debug_otp);
        console.log("🔄 RESEND OTP RECEIVED:", result.debug_otp);
        console.log("🔄 RESEND OTP RECEIVED:", result.debug_otp);
      }
      
      if (result?.status) {
        toast.success("OTP resent successfully!");
        setTimeLeft(60);
        setCanResend(false);
      } else {
        toast.error(result?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Update Password form
  const updatePasswordInitialState = { password: '' };
  const updatePasswordValidationSchema = Yup.object({
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
      .test('no-consecutive-chars', 'Password cannot have 4+ consecutive characters (like 1234, abcd)', value => {
        if (!value) return false;
        for (let i = 0; i < value.length - 3; i++) {
          if (value.charCodeAt(i) + 1 === value.charCodeAt(i + 1) && 
              value.charCodeAt(i + 1) + 1 === value.charCodeAt(i + 2) &&
              value.charCodeAt(i + 2) + 1 === value.charCodeAt(i + 3)) {
            return false;
          }
        }
        return true;
      })
      .test('no-common-patterns', 'Password is too common or predictable', value => {
        if (!value) return false;
        const commonPatterns = [
          'password', '123456', 'qwerty', 'abc123', 'password123',
          'admin', 'letmein', 'welcome', 'monkey', 'dragon'
        ];
        return !commonPatterns.some(pattern => 
          value.toLowerCase().includes(pattern)
        );
      })
  });

  const handleUpdatePasswordSubmit = async (values) => {
    const data = {
      url: apis().updatePassword,
      method: 'POST',
      body: { email: localStorage.getItem("email"), password: values.password }
    };

    const result = await httpAction(data);
    if (result?.status) {
      toast.success(result?.message);
      // Clear any stored email used during OTP flow and reset state
      try { localStorage.removeItem('email'); } catch (e) { /* ignore */ }
      setPasswordStrength(0);
      setTimeLeft(60);
      setCanResend(false);
      setAuthMode(AUTH_MODES.LOGIN);
    } else {
      toast.error(result?.message || "Something went wrong");
    }
  };

  // Render different forms based on auth mode
  const renderForm = () => {
    switch (authMode) {
      case AUTH_MODES.LOGIN:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <RiLoginCircleFill className="text-5xl text-purple-600 mb-2"/>
              <p className="text-2xl font-bold text-purple-800">Login Account</p>
            </div>

            <Formik
              key={`auth-${authMode}`}
              initialValues={loginInitialState}
              validationSchema={loginValidationSchema}
              onSubmit={handleLoginSubmit}
              enableReinitialize
            >
              {({ values, errors, touched, handleBlur, setFieldValue }) => (
                <Form className="flex flex-col gap-6" autoComplete="off">
                  <TextField
                    placeholder="Enter your email"
                    name="new-email"
                    type="email"
                    value={values.email || ''}
                    onChange={(e) => setFieldValue('email', e.target.value)}
                    onBlur={handleBlur}
                    variant="standard"
                    fullWidth
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    autoComplete="off"
                    id="new-email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutline />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    placeholder="Enter your password"
                    name="new-password"
                    type="password"
                    value={values.password || ''}
                    onChange={(e) => setFieldValue('password', e.target.value)}
                    onBlur={handleBlur}
                    variant="standard"
                    fullWidth
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    autoComplete="new-password"
                    id="new-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    className="!py-3 !rounded-lg font-semibold !bg-purple-600 hover:!bg-purple-700"
                    fullWidth
                  >
                    Login
                  </Button>
                </Form>
              )}
            </Formik>

            <Divider className="!my-6">OR</Divider>

            <Button
              variant="outlined"
              startIcon={<Google />}
              onClick={handleGoogleLogin}
              className="!py-3 !rounded-lg !border-purple-600 !text-purple-600 hover:!bg-purple-50"
              fullWidth
            >
              Continue with Google
            </Button>

            <div className="flex justify-between items-center mt-6 text-sm text-purple-600 font-medium">
              <button
                onClick={() => setAuthMode(AUTH_MODES.FORGOT_PASSWORD)}
                className="hover:underline"
              >
                Forgot Password?
              </button>
              <button
                onClick={() => setAuthMode(AUTH_MODES.REGISTER)}
                className="hover:underline"
              >
                Create New Account
              </button>
            </div>
          </>
        );

      case AUTH_MODES.REGISTER:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <IoPersonAddSharp className="text-5xl text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-800">Register New Account</p>
              <span className="text-purple-600 text-sm mt-1">Sign up to continue</span>
            </div>

            <Formik
              initialValues={registerInitialState}
              validationSchema={registerValidationSchema}
              onSubmit={handleRegisterSubmit}
            >
              {({ handleBlur, handleChange, values, touched, errors, setFieldValue, isSubmitting }) => (
                <Form className="flex flex-col gap-4">
                  <TextField
                    name="full_name"
                    value={values.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.full_name && Boolean(errors.full_name)}
                    helperText={touched.full_name && errors.full_name}
                    label="Enter your full name"
                    fullWidth
                    size="small"
                    placeholder="e.g., John Doe"
                    inputProps={{ maxLength: 50 }}
                    FormHelperTextProps={{ className: 'text-xs' }}
                    className="hover:shadow-md transition-all duration-200"
                  />

                  <TextField
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    label="Enter your email"
                    fullWidth
                    size="small"
                    placeholder="e.g., john.doe@example.com"
                    inputProps={{ maxLength: 254 }}
                    FormHelperTextProps={{ className: 'text-xs' }}
                    className="hover:shadow-md transition-all duration-200"
                  />

                  <div className="space-y-2">
                    <TextField
                      name="password"
                      type={visible ? 'text' : 'password'}
                      value={values.password}
                      onChange={(e) => {
                        handleChange(e);
                        checkPasswordStrength(e.target.value);
                      }}
                      onFocus={() => setShowPasswordRequirements(true)}
                      onBlur={(e) => {
                        handleBlur(e);
                        setTimeout(() => setShowPasswordRequirements(false), 2000);
                      }}
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      label="Create your password"
                      fullWidth
                      size="small"
                      placeholder="Enter strong password"
                      inputProps={{ maxLength: 128 }}
                      FormHelperTextProps={{ className: 'text-xs' }}
                      className="hover:shadow-md transition-all duration-200"
                    />
                    
                    {values.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password Strength:</span>
                          <span className={`font-medium ${getPasswordStrengthColor()}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded transition-all duration-300 ${
                                level <= passwordStrength
                                  ? passwordStrength <= 2
                                    ? 'bg-red-500'
                                    : passwordStrength <= 3
                                    ? 'bg-yellow-500'
                                    : passwordStrength <= 4
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {showPasswordRequirements && (
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
                      <p className="font-medium mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <span className={values.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                          ✓ At least 8 characters
                        </span>
                        <span className={/[a-z]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One lowercase letter
                        </span>
                        <span className={/[A-Z]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One uppercase letter
                        </span>
                        <span className={/[0-9]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One number
                        </span>
                        <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One special character
                        </span>
                      </div>
                    </div>
                  )}

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          setFieldValue('terms', e.target.checked);
                        }}
                        color="primary"
                        className="hover:scale-105 transition-transform duration-200"
                      />
                    }
                    label={
                      <Typography variant="body2" className="text-sm">
                        I agree to the{' '}
                        <a href="#" className="text-purple-600 hover:underline hover:text-purple-800 transition-colors duration-200">
                          Terms and Conditions
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-purple-600 hover:underline hover:text-purple-800 transition-colors duration-200">
                          Privacy Policy
                        </a>
                      </Typography>
                    }
                  />
                  {touched.terms && errors.terms && (
                    <Typography variant="caption" className="text-red-500 text-xs">
                      {errors.terms}
                    </Typography>
                  )}

                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    className="!py-3 !rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 !bg-purple-600 hover:!bg-purple-700"
                    disabled={!acceptedTerms || isSubmitting}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Register'}
                  </Button>

                  <Button
                    onClick={() => setAuthMode(AUTH_MODES.LOGIN)}
                    fullWidth
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    className="!py-3 !rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200 !border-purple-600 !text-purple-600 hover:!bg-purple-50"
                  >
                    Back to Login
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        );

      case AUTH_MODES.FORGOT_PASSWORD:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <GrPowerReset className="text-5xl text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-800">Find Your Account</p>
              <span className="text-purple-600 text-sm mt-1">
                Enter your registered email
              </span>
            </div>

            <Formik
              onSubmit={handleForgotPasswordSubmit}
              validationSchema={forgotPasswordValidationSchema}
              initialValues={forgotPasswordInitialState}
            >
              {({ handleBlur, handleChange, values, touched, errors }) => (
                <Form className="flex flex-col gap-4">
                  <TextField
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    label="Your email"
                    fullWidth
                    size="small"
                  />

                  <Button
                    disabled={loading}
                    endIcon={
                      loading ? <CircularProgress size={20} /> : <Send />
                    }
                    variant="contained"
                    fullWidth
                    type="submit"
                    className="!py-3 !rounded-lg font-semibold !bg-purple-600 hover:!bg-purple-700"
                  >
                    SEND OTP
                  </Button>

                  <Button
                    onClick={() => setAuthMode(AUTH_MODES.LOGIN)}
                    fullWidth
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    className="!py-3 !rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200 !border-purple-600 !text-purple-600 hover:!bg-purple-50"
                  >
                    Back to Login
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        );

      case AUTH_MODES.OTP_VERIFY:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <MdOutlineVerified className="text-5xl text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-800">Verify OTP</p>
              <span className="text-purple-600 text-sm mt-1">
                Enter the 6-digit OTP we just sent to your registered email
              </span>
            </div>

            <Formik
              onSubmit={handleOtpSubmit}
              validationSchema={otpValidationSchema}
              initialValues={otpInitialState}
            >
              {({ handleBlur, values, touched, errors, setFieldValue }) => (
                <Form className="flex flex-col gap-5">
                  <div className="grid grid-cols-6 gap-3">
                    {otpArray.map((item, index) => (
                      <TextField
                        key={index}
                        value={(values[item] ?? '')}
                        onChange={(event) => {
                          const value = (event.target.value || '')
                            .replace(/[^0-9]/g, '')
                            .slice(0, 1);
                          inputChange(value, setFieldValue, index + 1, item);
                        }}
                        inputProps={{
                          maxLength: 1,
                          pattern: "[0-9]*",
                          className: "text-center text-lg font-bold"
                        }}
                        id={index + 1}
                        type="text"
                        name={item}
                        size="small"
                        onBlur={handleBlur}
                        error={touched[item] && Boolean(errors[item])}
                      />
                    ))}
                  </div>

                  <Button
                    disabled={!otpArray.every((k) => ((values[k] ?? '').length === 1))}
                    variant="contained"
                    fullWidth
                    type="submit"
                    className="!py-3 !rounded-lg font-semibold !bg-purple-600 hover:!bg-purple-700"
                  >
                    Verify
                  </Button>

                  <div className="text-center">
                    {!canResend ? (
                      <div className="text-purple-600">
                        <p className="text-sm mb-2">OTP expires in:</p>
                        <p className="text-lg font-mono font-bold text-purple-600">
                          {formatTime(timeLeft)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600 font-medium">
                          OTP has expired!
                        </p>
                        <Button 
                          onClick={resendOtp} 
                          variant="contained" 
                          disabled={isResending}
                          className="!py-2 !px-4 !text-sm !bg-purple-600 hover:!bg-purple-700"
                        >
                          {isResending ? 'Sending...' : 'Resend OTP'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => setAuthMode(AUTH_MODES.LOGIN)}
                    fullWidth
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    className="!py-3 !rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200 !border-purple-600 !text-purple-600 hover:!bg-purple-50"
                  >
                    Back to Login
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        );

      case AUTH_MODES.UPDATE_PASSWORD:
        return (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 text-purple-600 shadow-md mb-3">
                <RxUpdate size={28} />
              </div>
              <h2 className="text-xl font-semibold text-purple-800">Update Your Password</h2>
              <p className="text-purple-600 text-sm">Create your new password</p>
            </div>

            <Formik
              onSubmit={handleUpdatePasswordSubmit}
              validationSchema={updatePasswordValidationSchema}
              initialValues={updatePasswordInitialState}
            >
              {({ handleBlur, handleChange, values, touched, errors }) => (
                <Form>
                  <div className="mb-4">
                    <TextField
                      type="password"
                      name="password"
                      value={values.password}
                      onChange={(e) => {
                        handleChange(e);
                        checkPasswordStrength(e.target.value);
                      }}
                      onFocus={() => setShowPasswordRequirements(true)}
                      onBlur={(e) => {
                        handleBlur(e);
                        setTimeout(() => setShowPasswordRequirements(false), 2000);
                      }}
                      size="small"
                      fullWidth
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      label="New Password"
                      placeholder="Enter strong password"
                      inputProps={{ maxLength: 128 }}
                      FormHelperTextProps={{ className: 'text-xs' }}
                      className="hover:shadow-md transition-all duration-200"
                    />
                    
                    {values.password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password Strength:</span>
                          <span className={`font-medium ${getPasswordStrengthColor()}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 flex-1 rounded transition-all duration-300 ${
                                level <= passwordStrength
                                  ? passwordStrength <= 2
                                    ? 'bg-red-500'
                                    : passwordStrength <= 3
                                    ? 'bg-yellow-500'
                                    : passwordStrength <= 4
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {showPasswordRequirements && (
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1 mb-4">
                      <p className="font-medium mb-2">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-1">
                        <span className={(values.password?.length ?? 0) >= 8 ? 'text-green-600' : 'text-gray-500'}>
                          ✓ At least 8 characters
                        </span>
                        <span className={/[a-z]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One lowercase letter
                        </span>
                        <span className={/[A-Z]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One uppercase letter
                        </span>
                        <span className={/[0-9]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One number
                        </span>
                        <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.password) ? 'text-green-600' : 'text-gray-500'}>
                          ✓ One special character
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <Button 
                      variant="contained" 
                      fullWidth 
                      type="submit" 
                      className="!bg-purple-600 hover:!bg-purple-700 !py-2 !rounded-lg !normal-case !text-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Update Password
                    </Button>
                  </div>

                  <Button
                    onClick={() => setAuthMode(AUTH_MODES.LOGIN)}
                    fullWidth
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    className="!py-3 !rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200 !border-purple-600 !text-purple-600 hover:!bg-purple-50"
                  >
                    Back to Login
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen flex bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300">
      {/* Left Branding */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/2 text-purple-800 p-12 relative">
        <img
          src={assets.logo}
          alt="Logo"
          className="w-28 h-28 mb-6 object-contain"
        />
        <h1 className="text-4xl font-bold text-purple-800">Welcome Back!</h1>
        <p className="mt-4 text-lg text-center max-w-sm opacity-80 text-purple-700">
          Connect with your team, manage your work, and explore new opportunities.
        </p>
        <img
          src={assets.bgImage}
          alt="Background"
          className="absolute bottom-0 right-0 w-1/2 opacity-10"
        />
      </div>

      {/* Right Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-10">
        <div className="w-full max-w-md bg-white/40 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/30">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default Login;
