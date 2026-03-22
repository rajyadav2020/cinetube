import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"

const getAllVideos = asynchandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const pipeline = [];

    if (query) {
        pipeline.push({
            $match: {
                title: { $regex: query, $options: "i" }
            }
        });
    }

    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    pipeline.push({
        $match: { ispublished: true }
    });

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    return res
        .status(200)
        .json(new Apiresponse(200, videos, "Videos fetched successfully"));
})

const publishAVideo = asynchandler(async (req, res) => {
    const { title, description} = req.body
    
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new Apierror(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new Apierror(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new Apierror(400, "Thumbnail file is required");
    }

    const videoFile = await uploadoncloudinary(videoFileLocalPath);
    const thumbnail = await uploadoncloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new Apierror(400, "Video file upload failed");
    }

    if (!thumbnail) {
        throw new Apierror(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
        title,
        description,
        videofile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id,
        ispublished: true
    });

    return res
        .status(201)
        .json(new Apiresponse(200, video, "Video published successfully"));
})

const getVideoById = asynchandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new Apierror(404, "Video not found");
    }

    video.views += 1;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new Apiresponse(200, video, "Video fetched successfully"));
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new Apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to update this video");
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new Apierror(400, "At least one field is required to update");
    }

    if (title) video.title = title;
    if (description) video.description = description;

    if (thumbnailLocalPath) {
        const thumbnail = await uploadoncloudinary(thumbnailLocalPath);
        if (!thumbnail) {
            throw new Apierror(400, "Thumbnail upload failed");
        }
        video.thumbnail = thumbnail.url;
    }

    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new Apiresponse(200, video, "Video updated successfully"));
})

const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new Apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to delete this video");
    }

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new Apiresponse(200, {}, "Video deleted successfully"));
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new Apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to toggle publish status");
    }

    video.ispublished = !video.ispublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new Apiresponse(200, video, "Publish status toggled successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}