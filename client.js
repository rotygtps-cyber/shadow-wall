const API_URL = '/api/notes';
let selectedColor = 'linear-gradient(135deg, #1e1e24, #2a2a35)';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
    setupColorPicker();
    
    // Auto-refresh every 5 seconds
    setInterval(fetchNotes, 5000);
});

function setupColorPicker() {
    const buttons = document.querySelectorAll('.color-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            selectedColor = btn.getAttribute('data-color');
        });
    });
}

// Post a new note
async function postNote() {
    const content = document.getElementById('noteInput').value;
    const tag = document.getElementById('tagInput').value;
    const btn = document.getElementById('postBtn');

    if (!content.trim()) {
        alert("Please write something!");
        return;
    }

    // Disable button to prevent spam
    btn.disabled = true;
    btn.innerText = "Posting...";

    const newNote = {
        content: content,
        tag: tag,
        color: selectedColor,
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNote)
        });
        
        // Clear input
        document.getElementById('noteInput').value = '';
        fetchNotes(); // Refresh list immediately
    } catch (err) {
        console.error("Error posting:", err);
        alert("Failed to connect to server.");
    }

    btn.disabled = false;
    btn.innerHTML = 'Post Anonymously <i class="fa-solid fa-paper-plane"></i>';
}

// Fetch and Display notes
async function fetchNotes() {
    try {
        const res = await fetch(API_URL);
        const notes = await res.json();
        renderNotes(notes);
    } catch (err) {
        console.error("Error fetching notes:", err);
    }
}

function renderNotes(notes) {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = ''; // Clear current

    // Sort by newest first
    notes.reverse().forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.background = note.color;
        
        // If background is dark, make text white
        if(note.color.includes('#1e1e24')) {
            card.classList.add('dark-mode-text');
        }

        const date = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="note-header">
                <span>#${note.tag}</span>
                <span>${date}</span>
            </div>
            <div class="note-content">
                ${escapeHtml(note.content)}
            </div>
            <div class="note-footer">
                <span>Anonymous</span>
                <button class="like-btn" onclick="likeNote('${note.id}')">
                    <i class="fa-solid fa-heart"></i> ${note.likes || 0}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Like a note
async function likeNote(id) {
    try {
        await fetch(`${API_URL}/${id}/like`, { method: 'POST' });
        fetchNotes(); // Refresh to show new like count
    } catch (err) {
        console.error("Error liking:", err);
    }
}

// Security: Prevent HTML injection
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}