import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Apierror} from "../utils/apierror.js"
import {Apiresponse} from "../utils/apiresponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body

    if (!name || name.trim() === "" || !description || description.trim() === "") {
        throw new Apierror(400, "Name and description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner: req.user._id
    })

    return res.status(201).json(
        new Apiresponse(201, playlist, "Playlist created successfully")
    )
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new Apierror(400, "Invalid user ID")
    }

    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 })

    return res.status(200).json(
        new Apiresponse(200, playlists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new Apierror(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Apierror(404, "Playlist not found")
    }

    return res.status(200).json(
        new Apiresponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid playlist ID or video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Apierror(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to modify this playlist")
    }

    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId)
        await playlist.save({ validateBeforeSave: false })
    }

    return res.status(200).json(
        new Apiresponse(200, playlist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new Apierror(400, "Invalid playlist ID or video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Apierror(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to modify this playlist")
    }

    if (playlist.videos.includes(videoId)) {
        playlist.videos = playlist.videos.filter(
            (id) => id.toString() !== videoId.toString()
        )
        await playlist.save({ validateBeforeSave: false })
    }

    return res.status(200).json(
        new Apiresponse(200, playlist, "Video removed from playlist successfully")
    )
})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new Apierror(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Apierror(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res.status(200).json(
        new Apiresponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new Apierror(400, "Invalid playlist ID")
    }

    if (!name && !description) {
        throw new Apierror(400, "At least name or description is required for update")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new Apierror(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new Apierror(403, "You do not have permission to update this playlist")
    }

    if (name) playlist.name = name
    if (description) playlist.description = description

    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(
        new Apiresponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}