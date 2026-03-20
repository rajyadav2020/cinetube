import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User" //this user is subscriber
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User" //this user is channel owner
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)