import { User } from "../models/user.model";
import { Apierror } from "../utils/apierror";
import { asynchandler } from "../utils/asynchandler";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT = asynchandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token) {
            throw new Apierror(401, "Unauthorized access")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new Apierror(401, "Invalid Acess Token ")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new Apierror(401, error?.message || "Invalid access token")
        
    }
})