import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});

const uploadoncloudinary = async (localfilepath)=>{
    try{
        if(!localfilepath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"
        })
        //fille has been uploaded successfully

        console.log("file is uploaded on cloudinary",
            response.url
        );
        return response

    }catch(error){
        console.error("Cloudinary upload Error:", error)
        fs.unlinkSync(localfilepath) //removes the localy saved temporary file as the upload operation got failes 
    }

}

export {uploadoncloudinary}