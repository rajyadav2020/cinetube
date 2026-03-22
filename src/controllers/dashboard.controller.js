import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const getChannelStats = asynchandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    const subscriberStats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 }
            }
        }
    ])

    const likeStats = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ])

    const stats = {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalSubscribers: subscriberStats[0]?.totalSubscribers || 0,
        totalLikes: likeStats[0]?.totalLikes || 0
    }

    return res.status(200).json(
        new Apiresponse(200, stats, "Channel stats fetched successfully")
    )
})

const getChannelVideos = asynchandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 })

    return res.status(200).json(
        new Apiresponse(200, videos, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
}