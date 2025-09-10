import React, { useState } from 'react';
import { RxUpdate } from "react-icons/rx";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import apis from '../utils/apis';
import httpAction from '../utils/httpAction';
import toast from 'react-hot-toast';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

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
        password: ''
    };

    const validationSchema = Yup.object({
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
            })
    });

    const submitHandler = async(values) => {
        const data = {
            url: apis().updatePassword,
            method: 'POST',
            body: { email: localStorage.getItem("email"), password: values.password }
        };

        const result = await httpAction(data);
        if (result?.status) {
            toast.success(result?.message);
            navigate('/');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100">
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 md:p-8">
                <Formik
                    onSubmit={submitHandler}
                    validationSchema={validationSchema}
                    initialValues={initialState}
                >
                    {({ handleBlur, handleChange, values, touched, errors }) => (
                        <Form>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 shadow-md mb-3">
                                    <RxUpdate size={28} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">Update Your Password</h2>
                                <p className="text-gray-500 text-sm">Create your new password</p>
                            </div>

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
                                        // Keep requirements visible while typing, hide after a delay when losing focus
                                        setTimeout(() => setShowPasswordRequirements(false), 2000);
                                    }}
                                    size="small"
                                    fullWidth
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                    label="New Password"
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

                            {/* Password Requirements - Show only on focus */}
                            {showPasswordRequirements && (
                                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1 mb-4">
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

                            <div className="mb-4">
                                <Button 
                                    variant="contained" 
                                    fullWidth 
                                    type="submit" 
                                    className="!bg-indigo-600 hover:!bg-indigo-700 !py-2 !rounded-lg !normal-case !text-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
                                >
                                    Update Password
                                </Button>
                            </div>

                            
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default UpdatePassword;
