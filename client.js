const API_URL = '/api/notes'; // Render finds the server automatically
let selectedColor = 'linear-gradient(135deg, #FF0055, #FF0099)';
let currentNoteId = null; // To track which note is open in the modal

document.addEventListener('DOMContentLoaded', () => {
    fetchNotes();
    setupColorPicker();
    setInterval(fetchNotes, 8000); // Auto-refresh every 8s
});

function setupColorPicker() {
    const buttons = document.querySelectorAll('.color-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.getAttribute('data-color');
        });
    });
}

async function postNote() {
    const content = document.getElementById('noteInput').value;
    const tag = document.getElementById('tagInput').value;
    const btn = document.getElementById('postBtn');

    if (!content.trim()) return alert("Walang laman ang note mo!");

    btn.disabled = true;
    btn.innerText = "Posting...";

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, tag, color: selectedColor })
        });
        document.getElementById('noteInput').value = '';
        fetchNotes();
    } catch (err) { alert("Server error. Try again!"); }

    btn.disabled = false;
    btn.innerHTML = 'Post sa Wall <i class="fa-solid fa-paper-plane"></i>';
}

async function fetchNotes() {
    try {
        const res = await fetch(API_URL);
        const notes = await res.json();
        renderNotes(notes);
    } catch (err) { console.error(err); }
}

function renderNotes(notes) {
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';

    notes.reverse().forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.background = note.color;

        const date = new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const commentCount = note.comments ? note.comments.length : 0;

        card.innerHTML = `
            <div class="note-header">
                <span><i class="fa-solid fa-tag"></i> ${note.tag}</span>
                <span>${date}</span>
            </div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-footer">
                <button class="action-btn" onclick="likeNote('${note.id}')">
                    <i class="fa-solid fa-heart"></i> ${note.likes || 0}
                </button>
                <button class="action-btn" onclick="openComments('${note.id}', '${escapeHtml(note.content)}')">
                    <i class="fa-solid fa-comment"></i> ${commentCount} Comments
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function likeNote(id) {
    await fetch(`${API_URL}/${id}/like`, { method: 'POST' });
    fetchNotes();
}

// --- NEW: Comment Functions ---

// Open Modal
async function openComments(id, content) {
    currentNoteId = id;
    document.getElementById('modalOriginalNote').innerHTML = `"${content}"`;
    document.getElementById('commentModal').style.display = "block";
    loadComments(id);
}

// Close Modal
function closeModal() {
    document.getElementById('commentModal').style.display = "none";
    currentNoteId = null;
}

// Fetch comments for specific note
async function loadComments(id) {
    const list = document.getElementById('commentsList');
    list.innerHTML = '<div style="color:#aaa; font-size:0.8rem;">Loading...</div>';
    
    // We reload all notes to get fresh comments (Simple method)
    const res = await fetch(API_URL);
    const notes = await res.json();
    const note = notes.find(n => n.id === id);
    
    list.innerHTML = '';
    if (note && note.comments && note.comments.length > 0) {
        note.comments.forEach(c => {
            const time = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            list.innerHTML += `
                <div class="comment-item">
                    ${escapeHtml(c.text)} <span class="comment-time">${time}</span>
                </div>`;
        });
    } else {
        list.innerHTML = '<div style="color:#777; font-size:0.9rem; text-align:center;">No comments yet. Be the first!</div>';
    }
}

// Post a new comment
async function postComment() {
    const input = document.getElementById('commentInput');
    const text = input.value;
    if (!text.trim() || !currentNoteId) return;

    await fetch(`${API_URL}/${currentNoteId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    input.value = '';
    loadComments(currentNoteId); // Refresh comments list inside modal
    fetchNotes(); // Refresh main wall counters
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Close modal if clicked outside
window.onclick = function(event) {
    const modal = document.getElementById('commentModal');
    if (event.target == modal) closeModal();
}
