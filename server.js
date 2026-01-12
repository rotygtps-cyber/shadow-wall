const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Uses Render port or default 3000
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'notes.json';

// --- PASTE YOUR WEBHOOK URL HERE ---
const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1460279813418913792/rKIJjmyMcSl_JYePIASlzAPUdq2mFwk2NLkfioP4bsVua6ImduN1Ojmfw15ZYFqe93Ne'; 
// -----------------------------------

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

// --- NEW PROFESSIONAL DISCORD DESIGN ---
async function sendToDiscord(note) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('PASTE_YOUR')) return;

    // 1. MATCH COLORS EXACTLY
    // We convert your CSS gradient colors to Discord "Decimal" colors
    let discordColor = 16711765; // Default Neon Pink (#FF0055)
    
    if (note.color.includes('#00C9FF')) discordColor = 51695;    // Neon Blue
    if (note.color.includes('#FDBB2D')) discordColor = 16628525; // Gold
    if (note.color.includes('#182848')) discordColor = 1584200;  // Midnight Blue

    // 2. CHOOSE AN ICON BASED ON TAG
    let emoji = "📢";
    if (note.tag === "Chika") emoji = "🍵";
    if (note.tag === "Love Letter") emoji = "💌";
    if (note.tag === "Rant") emoji = "😤";
    if (note.tag === "Meme") emoji = "🤡";

    const payload = {
        username: "TambayLand Support",
        avatar_url: "https://media.discordapp.net/attachments/1455269199764258889/1460285829753868398/logotambay.png?ex=69665ca8&is=69650b28&hm=5c11db2bf64d44644180d4ee41c39a6cc5c1572635bf18c2fe1bb05a59a3c1ad&=&format=webp&quality=lossless&width=646&height=656",
        embeds: [{
            // The colored side bar
            color: discordColor,
            
            // The "Header" (Tag Name)
            author: {
                name: `${emoji}  ${note.tag.toUpperCase()}`,
            },
            
            // The "Body" (Big bold text)
            // We use ``` blocks or # headers to make it stand out
            description: `### "${note.content}"`,
            
            // The "Footer" (Timestamp)
            footer: {
                text: "Sent via TambayLand Confession Wall",
                icon_url: "[https://cdn-icons-png.flaticon.com/512/1077/1077035.png](https://cdn-icons-png.flaticon.com/512/1077/1077035.png)" // Small Heart Icon
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
    
    // Send the new design
    sendToDiscord(newNote); 

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
