import User from "../models/User.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

const forgotPassword=async(req,res,next)=>{
    const {email}=req.body;
    try{
    
    const findedUser=await User.findOne({email:email});
    if(!findedUser){
        const error=new Error('Incorrect Email');
        error.statusCode = 400
        throw error
    }

    // Initialize password_otp if it doesn't exist
    if (!findedUser.password_otp) {
        findedUser.password_otp = {
            otp: null,
            send_time: null,
            limit: 5,
            last_attempt: null
        };
    }

    const userOtp = findedUser.password_otp?.otp
    if(userOtp){
        const timeDiff = new Date().getTime() - new Date(findedUser.password_otp.last_attempt).getTime()<= 
        24* 60 * 60 * 1000
        if(!timeDiff){
            findedUser.password_otp.limit = 5;
            await findedUser.save();
        }

        const remainLimit=findedUser.password_otp.limit===0
        if(timeDiff  && remainLimit){
            const error=new Error('You have reached the daily limit of 5 OTP requests. Please try again after 24 hours.');
            error.statusCode=400;
            throw error;
        }
    }
        const otp = Math.floor(Math.random()*900000) + 100000;
        
        findedUser.password_otp.otp = otp;
        findedUser.password_otp.limit = (findedUser.password_otp.limit || 5) - 1;
        findedUser.password_otp.last_attempt=new Date();
        findedUser.password_otp.send_time=new Date().getTime()+2*60*1000;
        await findedUser.save();

        const data={
            email:email,
            otp:otp
        }
        await sendOtpEmail(data);

        res.status(200).json({
            message:`otp send at:  ${email}`,
            status:true,
            otp:findedUser.password_otp.otp
        })
    }
    catch(error){
        next(error)
    }
}

export default forgotPassword;
