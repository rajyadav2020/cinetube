import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apierror.js";
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/apiresponse.js";

const registerUser = asynchandler(async (req,res)=>{
    //get user details from frontend 
    //validation - not empty
    //check if user already exist: we will chekc both by username and email
    //files checking - like avatar and images 
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return response

    //if a data is coming from forms than it can easiy be accessed by req.body
    const {fullname,email,username,password} = req.body
    console.log("email" , email );

    if(
        [fullname,email,username,password].some((field) => field?.trim()=== "")

    ){
        throw new Apierror(400, "all fields are compulsory or required")
    }

    const existedUser = User.findOne({
        $or: [{username},{email}]
    } )

    if(existedUser){
        throw new Apierror(409, "User already exists")
    }

    const avatarlocalpath = req.files?.avatar[0]?.path 

    const coverimagelocalpath = req.files?.coverImage[0]?.path;

    if(!avatarlocalpath){
        throw new Apierror(400, "Avatar file is required");
    }

    const avatar = await uploadoncloudinary(avatarlocalpath)
    const coverimage = await uploadoncloudinary(coverimagelocalpath)

    if(!avatar){
                throw new Apierror(400, "Avatar file is required");

    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createduser){
        throw new Apierror(500 , "something went wrong")
    }


    return res.status(201).json(
        new Apiresponse(200, createduser, "user registered successfully")
    )

} )

export {registerUser}