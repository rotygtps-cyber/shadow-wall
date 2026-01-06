const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'notes.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper: Read notes
const getNotes = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) { return []; }
};

// Helper: Save notes
const saveNotes = (notes) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
};

// 1. Get all notes
app.get('/api/notes', (req, res) => {
    const notes = getNotes();
    res.json(notes);
});

// 2. Post a note
app.post('/api/notes', (req, res) => {
    const { content, color, tag, timestamp } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const notes = getNotes();
    const newNote = {
        id: Date.now().toString(),
        content,
        color: color || 'linear-gradient(135deg, #1e1e24, #2a2a35)',
        tag: tag || 'Tambay',
        likes: 0,
        comments: [], // New Feature: Comments Array
        timestamp: timestamp || new Date().toISOString()
    };

    notes.push(newNote);
    saveNotes(notes);
    res.status(201).json(newNote);
});

// 3. Like a note
app.post('/api/notes/:id/like', (req, res) => {
    const { id } = req.params;
    let notes = getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
        note.likes += 1;
        saveNotes(notes);
        res.json({ success: true, likes: note.likes });
    } else {
        res.status(404).json({ error: "Note not found" });
    }
});

// 4. Post a Comment (NEW)
app.post('/api/notes/:id/comments', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text required" });

    let notes = getNotes();
    const note = notes.find(n => n.id === id);

    if (note) {
        const newComment = {
            id: Date.now().toString(),
            text: text,
            timestamp: new Date().toISOString()
        };
        // Ensure comments array exists
        if (!note.comments) note.comments = [];
        
        note.comments.push(newComment);
        saveNotes(notes);
        res.json({ success: true, comments: note.comments });
    } else {
        res.status(404).json({ error: "Note not found" });
    }
});

app.listen(PORT, () => {
    console.log(`TambayLand Server running at port ${PORT}`);
});
