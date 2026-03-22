import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID")
    }

    const like = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (like) {
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(
            new Apiresponse(200, { liked: false }, "Video unliked successfully")
        )
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        return res.status(200).json(
            new Apiresponse(200, { liked: true }, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new Apierror(400, "Invalid comment ID")
    }

    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (like) {
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(
            new Apiresponse(200, { liked: false }, "Comment unliked successfully")
        )
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        return res.status(200).json(
            new Apiresponse(200, { liked: true }, "Comment liked successfully")
        )
    }
})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new Apierror(400, "Invalid tweet ID")
    }

    const like = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (like) {
        await Like.findByIdAndDelete(like._id)
        return res.status(200).json(
            new Apiresponse(200, { liked: false }, "Tweet unliked successfully")
        )
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        return res.status(200).json(
            new Apiresponse(200, { liked: true }, "Tweet liked successfully")
        )
    }
})

const getLikedVideos = asynchandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo: "$videoDetails"
            }
        }
    ])

    return res.status(200).json(
        new Apiresponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}