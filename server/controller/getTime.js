import User from "../models/User.js";

const getTime=async(req,res,next)=>{
    const {email}  =  req.body;

    try{
        const findedUser=await User.findOne({email:email});
        if(!findedUser){
            const error = new Error('something went wrong');
            error.statusCode=400;
            throw error;
        }

        if(!findedUser.password_otp || !findedUser.password_otp.send_time){
            return res.status(400).json({message:"Please request a new OTP code", status:false});
        }

        const time = findedUser.password_otp.send_time.getTime();
        res.status(200).json({message:"otp send",status:true,time})
    }catch(error){
        next(error)
    }
}

export default getTime;