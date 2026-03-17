import { asynchandler } from "../utils/asynchandler.js";
import { Apierror } from "../utils/apierror.js";
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import { Apiresponse } from "../utils/apiresponse.js";

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    }catch(error){
        throw new Apierror(500, "Error while generating access and refresh token")
    }
}

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

    if(
        [fullname,email,username,password].some((field) => field?.trim()=== "")

    ){
        throw new Apierror(400, "all fields are compulsory or required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    } )

    if(existedUser){
        throw new Apierror(409, "User already exists")
    }
    

    const avatarlocalpath = req.files?.avatar?.[0]?.path;

    const coverimagelocalpath = req.files?.coverimage?.[0]?.path

    if(!avatarlocalpath){
        throw new Apierror(400, "Avatar file is required");
    }

    const avatar = await uploadoncloudinary(avatarlocalpath)
    const coverimage = await uploadoncloudinary(coverimagelocalpath)

    if(!avatar){
        throw new Apierror(400, "Error while uploading avatar");
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

const loginUser = asynchandler(async (req,res)=>{
    // req body - data
    //username or email
    //find the user
    //password check
    //generate access token and refresh token
    //send cookie
    //send response

    const {email,username,password} = req.body

    if(!email || !username){
        throw new Apierror(400, "email or username is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new Apierror(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordcorrect(password)

    if(!isPasswordValid){
        throw new Apierror(401, "Invalid password")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new Apiresponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

        const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options )
    .clearCookie("refreshToken",options)
    .json(new Apiresponse(200,{},"User logged out"))

})


export {
    registerUser,
    loginUser,
    logoutUser
}