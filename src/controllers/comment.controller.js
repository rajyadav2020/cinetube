import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const getVideoComments = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                ownerDetails: {
                    $first: "$ownerDetails"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ];

    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    return res.status(200).json(
        new Apiresponse(200, comments, "Comments fetched successfully")
    )
})

const addComment = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID")
    }

    if (!content || content.trim() === "") {
        throw new Apierror(400, "Comment content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    return res.status(201).json(
        new Apiresponse(201, comment, "Comment added successfully")
    )
})

const updateComment = asynchandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    if (!isValidObjectId(commentId)) {
        throw new Apierror(400, "Invalid comment ID")
    }

    if (!content || content.trim() === "") {
        throw new Apierror(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new Apierror(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to update this comment")
    }

    comment.content = content
    await comment.save({ validateBeforeSave: false })

    return res.status(200).json(
        new Apiresponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asynchandler(async (req, res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new Apierror(400, "Invalid comment ID")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new Apierror(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(
        new Apiresponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}