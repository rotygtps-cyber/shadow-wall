const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'notes.json';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper: Read notes from file
const getNotes = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// Helper: Save notes to file
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
    
    if (!content) {
        return res.status(400).json({ error: "Content is required" });
    }

    const notes = getNotes();
    
    const newNote = {
        id: Date.now().toString(), // Simple unique ID
        content,
        color: color || '#1e1e24',
        tag: tag || 'General',
        likes: 0,
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
    
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].likes += 1;
        saveNotes(notes);
        res.json({ success: true, likes: notes[noteIndex].likes });
    } else {
        res.status(404).json({ error: "Note not found" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`ShadowWall Server running at http://localhost:${PORT}`);
});