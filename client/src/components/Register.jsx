import React, { useState } from 'react';
import { IoPersonAddSharp } from "react-icons/io5";
import { TextField, Button, IconButton, Divider, Checkbox, FormControlLabel, Typography } from '@mui/material';
import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { ArrowBack, Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import httpAction from '../utils/httpAction';
import apis from '../utils/apis';
import toast from 'react-hot-toast';


const Register = () => {
  const [visible, setVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();

  const visibleHandler = () => setVisible(!visible);

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

  const initialState = {
    full_name: '',
    email: '',
    password: '',
    terms: false
  };

  const validationSchema = Yup.object({
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
        // Only check for 4+ consecutive characters, not 3
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

  
  const submitHandler = async (values, { resetForm, setSubmitting }) => {
    try {
      setSubmitting(true);
      
      // Remove terms from the data sent to API
      const { terms, ...apiData } = values;
      
      const data = {
        url: apis().registerUser,
        method: 'POST',
        body: apiData
      };

      const result = await httpAction(data);
      console.log(result);

      if (result?.status) {
        toast.success(result?.message || "Registration successful");
        resetForm();
        setAcceptedTerms(false);
        setPasswordStrength(0);
        navigate('/login');
      } else {
        toast.error(result?.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <IoPersonAddSharp className="text-5xl text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">Register New Account</p>
          <span className="text-gray-500 text-sm mt-1">Sign up to continue</span>
        </div>

        <Formik
          initialValues={initialState}
          validationSchema={validationSchema}
          onSubmit={submitHandler}
        >
          {({ handleBlur, handleChange, values, touched, errors, setFieldValue, isSubmitting }) => (
            <Form className="flex flex-col gap-4">
              {/* Name */}
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
                inputProps={{
                  maxLength: 50
                }}
                FormHelperTextProps={{
                  className: 'text-xs'
                }}
                className="hover:shadow-md transition-all duration-200"
              />

              {/* Email */}
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
                inputProps={{
                  maxLength: 254
                }}
                FormHelperTextProps={{
                  className: 'text-xs'
                }}
                className="hover:shadow-md transition-all duration-200"
              />

              {/* Password */}
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
                     // Keep requirements visible while typing, hide after a delay when losing focus
                     setTimeout(() => setShowPasswordRequirements(false), 2000);
                   }}
                   error={touched.password && Boolean(errors.password)}
                   helperText={touched.password && errors.password}
                   label="Create your password"
                   fullWidth
                   size="small"
                   placeholder="Enter strong password"
                   inputProps={{
                     maxLength: 128
                   }}
                   FormHelperTextProps={{
                     className: 'text-xs'
                   }}
                   className="hover:shadow-md transition-all duration-200"
                 />
                
                {/* Password Strength Indicator */}
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

                             {/* Password Requirements - Show only on focus */}
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

              {/* Terms and Conditions */}
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
                    <a href="#" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">
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

              {/* Register Button */}
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                className="!py-3 !rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                disabled={!acceptedTerms || isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Register'}
              </Button>

              <Divider className="!my-4">OR</Divider>

              {/* Back to login */}
              <Button
                onClick={() => navigate('/')}
                fullWidth
                startIcon={<ArrowBack />}
                variant="outlined"
                className="!py-3 !rounded-lg hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                Back to Login
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
