import React, { useState } from 'react';
import { GrPowerReset } from "react-icons/gr";
import { TextField, Button, CircularProgress } from '@mui/material';
import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { ArrowBack, Send } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apis from '../utils/apis';
import httpAction from '../utils/httpAction';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const initialState = {
    email: ''
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
  });

  const submitHandler = async (values) => {
    console.log(values);
    const data = {
      url: apis().forgotPassword,
      method: 'POST',
      body: { email: values.email },
    };

    setLoading(true);
    const result = await httpAction(data);
    setLoading(false);

    console.log("📧 Forgot password result:", result);
    
    // 🔍 DEBUG: Show OTP in browser console (remove in production)
    if (result?.debug_otp) {
      console.log("🔐 🔐 🔐 OTP RECEIVED:", result.debug_otp);
      console.log("🔐 🔐 🔐 OTP RECEIVED:", result.debug_otp);
      console.log("🔐 🔐 🔐 OTP RECEIVED:", result.debug_otp);
      console.log("📱 Use this OTP to verify:", result.debug_otp);
      console.log("🔐 🔐 🔐 OTP RECEIVED:", result.debug_otp);
      console.log("🔐 🔐 🔐 OTP RECEIVED:", result.debug_otp);
    }

    if (result?.status) {
      toast.success(result?.message);
      localStorage.setItem('email', values.email);
      navigate('/otp-varify');
    } else {
      toast.error(result?.message || "Something went wrong");
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <GrPowerReset className="text-5xl text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">Find Your Account</p>
          <span className="text-gray-500 text-sm mt-1">
            Enter your registered email
          </span>
        </div>

        {/* Formik Form */}
        <Formik
          onSubmit={submitHandler}
          validationSchema={validationSchema}
          initialValues={initialState}
        >
          {({ handleBlur, handleChange, values, touched, errors }) => (
            <Form className="flex flex-col gap-4">
              
              {/* Email Input */}
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

              {/* Submit Button */}
              <Button
                disabled={loading}
                endIcon={
                  loading ? <CircularProgress size={20} /> : <Send />
                }
                variant="contained"
                fullWidth
                type="submit"
                className="!py-3 !rounded-lg font-semibold"
              >
                SEND OTP
              </Button>

             
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ForgotPassword;
