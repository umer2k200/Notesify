require('dotenv').config();

const config = require('./config.json');
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require('./models/user.model');
const Note = require('./models/note.model');

const express = require('express');
const cors = require('cors');
const app = express();

const jwt = require('jsonwebtoken');
const {authenticateToken} = require('./utilities');

app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);

app.get("/", (req, res) => {
    res.json({data:'hello umer'});
});

// Signup
app.post("/create-account", async (req, res) => {
    
    const { fullName, email, password } = req.body;

    if(!fullName){
        return res.status(400).json({error: true, message: "Full name is required!"});
    }
    if(!email){
        return res.status(400).json({ error: true, message: "Email is required"});
    }
    if(!password){
        return res.status(400).json({error: true, message: "Password is required"});
    }

    const isUser = await User.findOne({email: email});
    if (isUser){
        console.log(res.body);
        return res.json({
            error: true,
            message: "User already exists!",
        });
    }
    const user = new User({
        fullName,
        email,
        password,
    });
    await user.save();

    const accessToken = jwt.sign({ user
        }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '3600m'
    });

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration successful!",
    });
});

// Login user
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if(!email){
        return res.status(400).json({error: true, message: "Email is required"});
    }
    if(!password){
        return res.status(400).json({error: true, message: "Password is required"});
    }

    const userInfo = await User.findOne({email: email});
    if (!userInfo){
        return res.status(400).json({
            error: true,
            message: "User does not exist!",
        });
    }
    if (userInfo.email == email && userInfo.password == password){
        const user = { user: userInfo};
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '3600m'
        });

        return res.json({
            error: false,
            email,
            accessToken,
            message: "Login successful!",
        });
    } else{
        return res.status(400).json({
            error: true,
            message: "Invalid credentials!",
        });
    }
});

//add notes
app.post("/add-note", authenticateToken, async (req, res) => {
    const { title, content, tags} = req.body;
    const { user } = req.user;
    if (!title) {
        return res.status(400).json({ error: true, message: "Title is required!" });
    }
    if (!content) {
        return res.status(400).json({ error: true, message: "Content is required!" });
    }

    try{
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });
        await note.save();
        return res.json({
            error: false,
            note,
            message: "Note added successfully!",
        });
    }
    catch(err){
        return res.status(500).json({
            error: true,
            message: "Error adding note!",
        });
    }
});

//edit note
app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;
    const noteId = req.params.noteId;

    if (!title  && !content && !tags) {
        return res.status(400).json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });
        
        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found!" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if( isPinned) note.isPinned = isPinned;

        await note.save();
        return res.json({
            error: false,
            note,
            message: "Note updated successfully!",
        });

    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error updating note!",
        });
    }
});

//get all notes
app.get("/get-all-notes", authenticateToken, async (req, res) => {
    const { user } = req.user;
    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1});
        return res.json({
            error: false,
            notes,
            message: "Notes fetched successfully!",
        });
    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error fetching notes!",
        });
    }
});

//Delete note
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const noteId = req.params.noteId;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });
        
        if ( !note){
            return res.status(404).json({ error: true, message: "Note not found!" });
        }
        await Note.deleteOne({ _id: noteId, userId: user._id });
        return res.json({
            error: false,
            message: "Note deleted successfully!",
        });

    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error deleting note!",
        });
    }
});

//Update isPinned status
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const noteId = req.params.noteId;
    const { isPinned } = req.body;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });
        
        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found!" });
        }

        if ( isPinned) note.isPinned = isPinned || false;
        else note.isPinned = false;
        await note.save();
        return res.json({
            error: false,
            note,
            message: "Note updated successfully!",
        });

    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error updating note!",
        });
    }
});

//Get a user
app.get("/get-user", authenticateToken, async (req, res) => {
    const { user } = req.user;
    try {
        const userInfo = await User.findOne({ _id: user._id });
        if(!userInfo) {
            return res.status(401);
        }

        return res.json({
            user:{fullName: userInfo.fullName, email: userInfo.email, '_id': userInfo._id, createdOn: userInfo.createdOn},
            message: "User fetched successfully!",
        });
    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error fetching user!",
        });
    }
});

//search notes
app.get('/search-notes/', authenticateToken, async (req, res) => {
    const { user } = req.user;
    const {query} = req.query;
    if (!query) {
        return res.status(400).json({ error: true, message: "Query is required!" });
    }
    try {
        const matchingNotes = await Note.find({ 
            userId: user._id, 
            $or: [
                { title: { $regex: new RegExp(query, 'i')}},
                { content: {$regex: new RegExp(query, 'i')}},
            ],
        });
        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query retrieved successfully!",
        });
    } catch (err) {
        return res.status(500).json({
            error: true,
            message: "Error fetching notes!",
        });
    }
}
);

app.listen(8082);

module.exports = app;