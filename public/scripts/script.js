function showMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    setTimeout(() => {
        messagesDiv.innerHTML = '';
    }, 5000);
}

// Show temporary save indicator
function showSaveIndicator(element, success = true) {
    const indicator = document.createElement('span');
    indicator.className = `save-indicator ms-2 ${success ? 'text-success' : 'text-danger'}`;
    indicator.innerHTML = success ? '<i class="bi bi-check-circle"></i>' : '<i class="bi bi-x-circle"></i>';

    element.appendChild(indicator);
    setTimeout(() => indicator.classList.add('show'), 10);

    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }, 2000);
}

// CREATE - Add new song
document.getElementById('addSongForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const song = {
        songTitle: document.getElementById('songTitle').value,
        artist: document.getElementById('artist').value,
        year: parseInt(document.getElementById('year').value),
        genre: document.getElementById('genre').value
    };

    console.log(song);

    try {
        const response = await fetch('/api/songs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(song)
        });

        const result = await response.json();
        console.log(result);
        if (response.ok) {
            showMessage(`Song "${song.songTitle}" added successfully!`, 'success');
            document.getElementById('addSongForm').reset();
            loadSongs();
        } else {
            showMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, 'danger');
    }
});

// READ - Load all songs
async function loadSongs() {
    try {
        const response = await fetch('/api/songs');
        const songs = await response.json();

        const songsList = document.getElementById('songsList');

        if (songs.length === 0) {
            songsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-person-x fs-1"></i>
                    <p>No songs found. Try seeding the database!</p>
                </div>
            `;
            return;
        }

        songsList.innerHTML = songs.map(song => `
            <div class="card mb-3 song-card" data-song-id="${song._id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <strong>Title:</strong>
                            <div class="editable-field" 
                                 data-field="songTitle" 
                                 data-song-id="${song._id}"
                                 title="Click to edit Title">${song.songTitle}</div>
                        </div>
                           <div class="col-md-3">
                            <strong>Artist:</strong>
                            <div class="editable-field" 
                                 data-field="artist" 
                                 data-song-id="${song._id}"
                                 title="Click to edit Artist">${song.artist}</div>
                        </div>
                        <div class="col-md-2">
                            <strong>Year:</strong>
                            <div class="editable-field" 
                                 data-field="year" 
                                 data-song-id="${song._id}"
                                 title="Click to edit age">${song.year}</div>
                        </div>
                        <div class="col-md-2">
                            <strong>Genre:</strong>
                            <div class="editable-field" 
                                 data-field="genre" 
                                 data-song-id="${song._id}"
                                 title="Click to edit Genre">${song.genre}</div>
                        </div>
                        <div class="col-md-3">
                            <small class="text-muted">
                                <i class="bi bi-tag"></i> ID: ${song._id}
                            </small>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-outline-danger btn-sm" 
                                    onclick="deleteSong('${song._id}', '${song.songTitle}')">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click event listeners for inline editing
        addInlineEditListeners();

        showMessage(`Loaded ${songs.length} songs. Click any field to edit!`, 'info');
    } catch (error) {
        showMessage(`Error loading songs: ${error.message}`, 'danger');
    }
}

// Add inline editing functionality
function addInlineEditListeners() {
    document.querySelectorAll('.editable-field').forEach(field => {
        field.addEventListener('click', function () {
            if (this.querySelector('input')) return; // Already editing

            const currentValue = this.textContent;
            const fieldType = this.getAttribute('data-field');
            const songId = this.getAttribute('data-song-id');

            // Create input element
            const input = document.createElement('input');
            input.type = fieldType === 'year' ? 'number' : 'text';
            input.value = currentValue;
            input.className = 'form-control form-control-sm';

            if (fieldType === 'year') {
                input.min = '1000';
                input.max = '2026';
            }

            // Add styling for editing state
            this.classList.add('editing');
            this.innerHTML = '';
            this.appendChild(input);

            // Focus and select the input
            input.focus();
            input.select();

            // Save on Enter or blur
            const saveEdit = async () => {
                const newValue = input.value.trim();

                if (!newValue) {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                    showMessage('Value cannot be empty', 'warning');
                    return;
                }

                if (newValue === currentValue) {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                    return;
                }

                // Update in database
                const success = await updateSongField(songId, fieldType, newValue);

                if (success) {
                    this.textContent = newValue;
                    showSaveIndicator(this, true);
                } else {
                    this.textContent = currentValue;
                    showSaveIndicator(this, false);
                }

                this.classList.remove('editing');
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                } else if (e.key === 'Escape') {
                    this.textContent = currentValue;
                    this.classList.remove('editing');
                }
            });
        });
    });
}

// UPDATE - Update single field
async function updateSongField(songId, field, value) {
    try {
        const updateData = {};
        updateData[field] = field === 'year' ? parseInt(value) : value;

        const response = await fetch(`/api/songs/${songId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`, 'success');
            return true;
        } else {
            showMessage(`Error: ${result.error}`, 'danger');
            return false;
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, 'danger');
        return false;
    }
}

// DELETE - Delete song
async function deleteSong(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/songs/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`song "${title}" deleted successfully!`, 'success');

            // Animate removal
            const songCard = document.querySelector(`[data-song-id="${id}"]`);
            if (songCard) {
                songCard.style.opacity = '0';
                songCard.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    songCard.remove();
                }, 300);
            }
        } else {
            showMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, 'danger');
    }
}

// Seed Database
async function seedDatabase() {
    if (!confirm('This will add sample songs to the database. Continue?')) {
        return;
    }

    try {
        showMessage('Seeding database...', 'info');
        const response = await fetch('/api/seed', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`${result.message}`, 'success');
            loadSongs();
        } else {
            showMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, 'danger');
    }
}

// Cleanup Database
async function cleanupDatabase() {
    if (!confirm('This will DELETE ALL songs from the database. Are you sure?')) {
        return;
    }

    try {
        showMessage('Cleaning database...', 'info');
        const response = await fetch('/api/cleanup', {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`${result.message}`, 'success');
            loadSongs();
        } else {
            showMessage(`Error: ${result.error}`, 'danger');
        }
    } catch (error) {
        showMessage(`Network error: ${error.message}`, 'danger');
    }
}

// Load songs when page loads
window.addEventListener('load', loadSongs);