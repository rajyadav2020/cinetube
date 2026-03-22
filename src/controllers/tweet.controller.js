import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if (!content || content.trim() === "") {
        throw new Apierror(400, "Tweet content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    return res.status(201).json(
        new Apiresponse(201, tweet, "Tweet created successfully")
    )
})

const getUserTweets = asynchandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new Apierror(400, "Invalid user ID")
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })

    return res.status(200).json(
        new Apiresponse(200, tweets, "User tweets fetched successfully")
    )
})

const updateTweet = asynchandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body

    if (!isValidObjectId(tweetId)) {
        throw new Apierror(400, "Invalid tweet ID")
    }

    if (!content || content.trim() === "") {
        throw new Apierror(400, "Tweet content is required to update")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new Apierror(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to update this tweet")
    }

    tweet.content = content
    await tweet.save({ validateBeforeSave: false })

    return res.status(200).json(
        new Apiresponse(200, tweet, "Tweet updated successfully")
    )
})

const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if (!isValidObjectId(tweetId)) {
        throw new Apierror(400, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new Apierror(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new Apiresponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}