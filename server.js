const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'notes.json';

// --- PASTE YOUR DISCORD WEBHOOK URL HERE ---
const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1460279813418913792/rKIJjmyMcSl_JYePIASlzAPUdq2mFwk2NLkfioP4bsVua6ImduN1Ojmfw15ZYFqe93Ne'; 
// -------------------------------------------

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

// Helper: Send to Discord
async function sendToDiscord(note) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('PASTE_YOUR')) return;

    // Convert CSS gradient colors to a single Hex integer for Discord Embed
    // Defaulting to Pink/Red if unknown
    let hexColor = 16711765; // #FF0055
    if (note.color.includes('#00C9FF')) hexColor = 51695; // Blue
    if (note.color.includes('#FDBB2D')) hexColor = 16628525; // Gold
    if (note.color.includes('#182848')) hexColor = 1584200; // Dark Blue

    const payload = {
        username: "TambayLand Wall",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/2665/2665448.png", // Generic Ghost Icon
        embeds: [{
            title: `New ${note.tag}! 📢`,
            description: note.content,
            color: hexColor,
            footer: {
                text: "Sent from TambayLand Confession Wall"
            },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Failed to send to Discord:", err);
    }
}

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
        comments: [],
        timestamp: timestamp || new Date().toISOString()
    };

    notes.push(newNote);
    saveNotes(notes);
    
    // --- SEND TO DISCORD HERE ---
    sendToDiscord(newNote); 
    // ----------------------------

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

// 4. Post a Comment
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
