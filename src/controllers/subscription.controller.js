import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleSubscription = asynchandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new Apierror(400, "Invalid channel ID");
    }

    if (channelId === req.user._id.toString()) {
        throw new Apierror(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(
            new Apiresponse(200, { subscribed: false }, "Unsubscribed successfully")
        );
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(200).json(
            new Apiresponse(200, { subscribed: true }, "Subscribed successfully")
        );
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new Apierror(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberDetails: {
                    $first: "$subscriberDetails"
                }
            }
        },
        {
            $project: {
                subscriberDetails: 1,
                createdAt: 1
            }
        }
    ]);

    return res.status(200).json(
        new Apiresponse(200, subscribers, "Subscribers fetched successfully")
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new Apierror(400, "Invalid subscriber ID");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channelDetails: {
                    $first: "$channelDetails"
                }
            }
        },
        {
            $project: {
                channelDetails: 1,
                createdAt: 1
            }
        }
    ]);

    return res.status(200).json(
        new Apiresponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}