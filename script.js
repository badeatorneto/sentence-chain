/* ===================================
   GLOBAL VARIABLES & INITIALIZATION
   =================================== */

// Storage keys
const STORAGE_KEYS = {
    SENTENCES: 'sentenceChain_sentences',
    SUBMISSION_DATE: 'sentenceChain_submissionDate',
    LIKES: 'sentenceChain_likes'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupEventListeners();
    loadSentences();
    displayTopSentences();
    checkSubmissionStatus();
    startAutoRefresh();
    
    // Hide loader after content loads
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 500);
});

/* ===================================
   INITIALIZATION FUNCTIONS
   =================================== */

function initializePage() {
    // Set today's date
    const today = getCurrentDate();
    const dateElement = document.getElementById('storyDate');
    if (dateElement) {
        dateElement.textContent = formatDate(new Date());
    }
    
    // Check if it's a new day and reset if needed
    checkAndResetDaily();
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function setupEventListeners() {
    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
    
    // Hero button scroll
    const heroBtn = document.getElementById('heroBtn');
    if (heroBtn) {
        heroBtn.addEventListener('click', () => {
            const formSection = document.getElementById('formSection');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Form submission
    const sentenceForm = document.getElementById('sentenceForm');
    if (sentenceForm) {
        sentenceForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Character counter
    const sentenceInput = document.getElementById('sentence');
    const charCount = document.getElementById('charCount');
    
    if (sentenceInput && charCount) {
        sentenceInput.addEventListener('input', () => {
            const count = sentenceInput.value.length;
            charCount.textContent = count;
            
            const counterElement = charCount.parentElement;
            counterElement.classList.remove('warning', 'error');
            
            if (count > 180) {
                counterElement.classList.add('warning');
            }
            if (count === 200) {
                counterElement.classList.add('error');
            }
        });
    }
}

/* ===================================
   DATE & TIME FUNCTIONS
   =================================== */

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const sentenceTime = new Date(timestamp);
    const diffMs = now - sentenceTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return formatTime(sentenceTime);
}

/* ===================================
   STORAGE FUNCTIONS
   =================================== */

function getSentences() {
    const stored = localStorage.getItem(STORAGE_KEYS.SENTENCES);
    if (!stored) return [];
    
    const allSentences = JSON.parse(stored);
    const today = getCurrentDate();
    
    // Return only today's sentences
    return allSentences.filter(s => s.date === today);
}

function saveSentence(sentenceData) {
    const stored = localStorage.getItem(STORAGE_KEYS.SENTENCES);
    const allSentences = stored ? JSON.parse(stored) : [];
    
    allSentences.push(sentenceData);
    localStorage.setItem(STORAGE_KEYS.SENTENCES, JSON.stringify(allSentences));
}

function getLikes() {
    const stored = localStorage.getItem(STORAGE_KEYS.LIKES);
    return stored ? JSON.parse(stored) : {};
}

function saveLikes(likes) {
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
}

function checkAndResetDaily() {
    const today = getCurrentDate();
    const stored = localStorage.getItem(STORAGE_KEYS.SENTENCES);
    
    if (!stored) {
        // First time user - add sample sentences
        initializeSampleData();
        return;
    }
    
    const allSentences = JSON.parse(stored);
    const todaySentences = allSentences.filter(s => s.date === today);
    
    // If no sentences today, it's a new day - reset submission status
    if (todaySentences.length === 0) {
        localStorage.removeItem(STORAGE_KEYS.SUBMISSION_DATE);
    }
}

function initializeSampleData() {
    const today = getCurrentDate();
    const sampleSentences = [
        {
            id: generateId(),
            text: "In a world where time moved backwards, Sarah woke up knowing exactly how her day would end.",
            author: "TimeKeeper",
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            date: today,
            likes: 12
        },
        {
            id: generateId(),
            text: "She rushed to the coffee shop, determined to prevent the spill that would ruin her favorite book.",
            author: "StoryWeaver",
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
            date: today,
            likes: 8
        },
        {
            id: generateId(),
            text: "But when she arrived, the barista looked at her with knowing eyes and said, 'You're early today.'",
            author: "Anonymous",
            timestamp: new Date(Date.now() - 900000).toISOString(), // 15 mins ago
            date: today,
            likes: 15
        }
    ];
    
    localStorage.setItem(STORAGE_KEYS.SENTENCES, JSON.stringify(sampleSentences));
}

/* ===================================
   FORM HANDLING
   =================================== */

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Check if already submitted today
    const submissionDate = localStorage.getItem(STORAGE_KEYS.SUBMISSION_DATE);
    const today = getCurrentDate();
    
    if (submissionDate === today) {
        showNotification('alreadySubmittedNotice');
        return;
    }
    
    const usernameInput = document.getElementById('username');
    const sentenceInput = document.getElementById('sentence');
    
    const username = usernameInput.value.trim() || 'Anonymous';
    const sentence = sentenceInput.value.trim();
    
    // Validation
    if (!sentence) {
        showNotification('errorNotification', 'Please enter a sentence');
        return;
    }
    
    if (sentence.length > 200) {
        showNotification('errorNotification', 'Sentence must be 200 characters or less');
        return;
    }
    
    // Create sentence object
    const newSentence = {
        id: generateId(),
        text: sentence,
        author: username,
        timestamp: new Date().toISOString(),
        date: today,
        likes: 0
    };
    
    // Save sentence
    saveSentence(newSentence);
    
    // Mark as submitted today
    localStorage.setItem(STORAGE_KEYS.SUBMISSION_DATE, today);
    
    // Show success notification
    showNotification('successNotification');
    
    // Add sentence to display immediately
    addSentenceToDOM(newSentence);
    
    // Scroll to the new sentence
    setTimeout(() => {
        const storyContainer = document.getElementById('storyContainer');
        storyContainer.scrollTop = storyContainer.scrollHeight;
    }, 100);
    
    // Clear form
    sentenceInput.value = '';
    document.getElementById('charCount').textContent = '0';
    
    // Hide form and show submitted notice after delay
    setTimeout(() => {
        checkSubmissionStatus();
    }, 2000);
    
    // Update top sentences
    displayTopSentences();
}

function showNotification(notificationId, customMessage = null) {
    // Hide all notifications first
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(n => n.classList.remove('show'));
    
    // Show the specified notification
    const notification = document.getElementById(notificationId);
    if (notification) {
        if (customMessage && notificationId === 'errorNotification') {
            document.getElementById('errorMessage').textContent = customMessage;
        }
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

function checkSubmissionStatus() {
    const submissionDate = localStorage.getItem(STORAGE_KEYS.SUBMISSION_DATE);
    const today = getCurrentDate();
    const form = document.getElementById('sentenceForm');
    const notice = document.getElementById('alreadySubmittedNotice');
    
    if (submissionDate === today) {
        if (form) form.style.display = 'none';
        if (notice) notice.classList.add('show');
    } else {
        if (form) form.style.display = 'flex';
        if (notice) notice.classList.remove('show');
    }
}

/* ===================================
   DISPLAY FUNCTIONS
   =================================== */

function loadSentences() {
    const sentences = getSentences();
    const container = document.getElementById('storyContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    
    if (!container) return;
    
    // Remove existing sentence cards
    const existingCards = container.querySelectorAll('.sentence-card');
    existingCards.forEach(card => card.remove());
    
    if (sentences.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    // Sort by timestamp
    sentences.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Display each sentence
    sentences.forEach(sentence => {
        addSentenceToDOM(sentence, false);
    });
}

function addSentenceToDOM(sentence, animate = true) {
    const container = document.getElementById('storyContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    
    if (!container) return;
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    const card = createSentenceCard(sentence);
    
    if (!animate) {
        card.style.animation = 'none';
    }
    
    container.appendChild(card);
}

function createSentenceCard(sentence) {
    const card = document.createElement('div');
    card.className = 'sentence-card';
    card.dataset.id = sentence.id;
    
    const likes = getLikes();
    const userLiked = likes[sentence.id] || false;
    const likeCount = sentence.likes || 0;
    
    card.innerHTML = `
        <div class="sentence-header">
            <div class="sentence-meta">
                <span class="sentence-author">${escapeHtml(sentence.author)}</span>
                <span class="sentence-time">${getTimeAgo(sentence.timestamp)}</span>
            </div>
        </div>
        <p class="sentence-text">${escapeHtml(sentence.text)}</p>
        <div class="sentence-actions">
            <button class="like-btn ${userLiked ? 'liked' : ''}" data-id="${sentence.id}">
                <svg class="like-icon" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span class="like-count">${likeCount}</span>
            </button>
        </div>
    `;
    
    // Add like button event listener
    const likeBtn = card.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => handleLike(sentence.id));
    
    return card;
}

function handleLike(sentenceId) {
    const likes = getLikes();
    const sentences = getSentences();
    const sentence = sentences.find(s => s.id === sentenceId);
    
    if (!sentence) return;
    
    // Toggle like
    if (likes[sentenceId]) {
        // Unlike
        delete likes[sentenceId];
        sentence.likes = Math.max(0, (sentence.likes || 0) - 1);
    } else {
        // Like
        likes[sentenceId] = true;
        sentence.likes = (sentence.likes || 0) + 1;
    }
    
    // Save updated data
    saveLikes(likes);
    updateSentence(sentence);
    
    // Update display
    updateLikeButton(sentenceId, likes[sentenceId], sentence.likes);
    displayTopSentences();
}

function updateLikeButton(sentenceId, liked, count) {
    const card = document.querySelector(`[data-id="${sentenceId}"]`);
    if (!card) return;
    
    const likeBtn = card.querySelector('.like-btn');
    const likeCount = card.querySelector('.like-count');
    
    if (liked) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
    
    likeCount.textContent = count;
}

function updateSentence(updatedSentence) {
    const stored = localStorage.getItem(STORAGE_KEYS.SENTENCES);
    if (!stored) return;
    
    const allSentences = JSON.parse(stored);
    const index = allSentences.findIndex(s => s.id === updatedSentence.id);
    
    if (index !== -1) {
        allSentences[index] = updatedSentence;
        localStorage.setItem(STORAGE_KEYS.SENTENCES, JSON.stringify(allSentences));
    }
}

/* ===================================
   TOP SENTENCES DISPLAY
   =================================== */

function displayTopSentences() {
    const sentences = getSentences();
    const container = document.getElementById('topSentencesGrid');
    
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Get top 3 sentences by likes
    const topSentences = sentences
        .filter(s => (s.likes || 0) > 0)
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 3);
    
    if (topSentences.length === 0) {
        container.innerHTML = `
            <div class="top-sentence-empty">
                <p>No liked sentences yet. Be the first to like a sentence!</p>
            </div>
        `;
        return;
    }
    
    topSentences.forEach((sentence, index) => {
        const card = createTopSentenceCard(sentence, index + 1);
        container.appendChild(card);
    });
}

function createTopSentenceCard(sentence, rank) {
    const card = document.createElement('div');
    card.className = 'top-sentence-card';
    
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ];
    
    card.style.background = gradients[rank - 1] || gradients[0];
    
    card.innerHTML = `
        <div class="top-sentence-rank">#${rank}</div>
        <p class="top-sentence-text">${escapeHtml(sentence.text)}</p>
        <div class="top-sentence-footer">
            <span class="top-sentence-author">${escapeHtml(sentence.author)}</span>
            <span class="top-sentence-likes">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                ${sentence.likes}
            </span>
        </div>
    `;
    
    return card;
}

/* ===================================
   AUTO-REFRESH FUNCTIONALITY
   =================================== */

function startAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(() => {
        loadSentences();
        displayTopSentences();
    }, 30000);
}

/* ===================================
   UTILITY FUNCTIONS
   =================================== */

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ===================================
   ARCHIVE PAGE FUNCTIONS
   =================================== */

function loadArchive() {
    const archiveContainer = document.getElementById('archiveContainer');
    if (!archiveContainer) return;
    
    const stored = localStorage.getItem(STORAGE_KEYS.SENTENCES);
    if (!stored) {
        archiveContainer.innerHTML = `
            <div class="archive-empty">
                <p>No archived stories yet. Check back after creating some stories!</p>
            </div>
        `;
        return;
    }
    
    const allSentences = JSON.parse(stored);
    
    // Group sentences by date
    const groupedByDate = {};
    allSentences.forEach(sentence => {
        if (!groupedByDate[sentence.date]) {
            groupedByDate[sentence.date] = [];
        }
        groupedByDate[sentence.date].push(sentence);
    });
    
    // Sort dates in descending order
    const dates = Object.keys(groupedByDate).sort().reverse();
    
    if (dates.length === 0) {
        archiveContainer.innerHTML = `
            <div class="archive-empty">
                <p>No archived stories yet. Check back after creating some stories!</p>
            </div>
        `;
        return;
    }
    
    dates.forEach(date => {
        const sentences = groupedByDate[date].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        const dateCard = createArchiveDateCard(date, sentences);
        archiveContainer.appendChild(dateCard);
    });
}

function createArchiveDateCard(date, sentences) {
    const card = document.createElement('div');
    card.className = 'archive-card';
    
    const dateObj = new Date(date + 'T00:00:00');
    const formattedDate = formatDate(dateObj);
    
    card.innerHTML = `
        <div class="archive-header">
            <h3 class="archive-date">${formattedDate}</h3>
            <span class="archive-count">${sentences.length} sentence${sentences.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="archive-story">
            ${sentences.map(s => `
                <p class="archive-sentence">
                    <span class="archive-sentence-text">${escapeHtml(s.text)}</span>
                    <span class="archive-sentence-author">— ${escapeHtml(s.author)}</span>
                </p>
            `).join('')}
        </div>
    `;
    
    return card;
}

// Initialize archive page if we're on it
if (window.location.pathname.includes('archive.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        loadArchive();
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    });
}
