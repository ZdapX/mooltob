// ===== THEME TOGGLE =====
function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.querySelector('.theme-toggle');
    
    body.classList.toggle('dark-mode');
    
    // Update button icon
    if (body.classList.contains('dark-mode')) {
        toggleBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        toggleBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.querySelector('.theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    } else {
        if (toggleBtn) toggleBtn.textContent = '🌙';
    }
});

// ===== FORMAT TIME =====
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
    return date.toLocaleDateString();
}

// ===== TRUNCATE TEXT =====
function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ===== SANITIZE HTML (basic) =====
function sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== COPY TO CLIPBOARD =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Copied to clipboard!');
    });
}

// ===== FORM VALIDATION HELPERS =====
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

// ===== CONFIRM ACTION =====
function confirmAction(message) {
    return confirm(message || 'Are you sure?');
}

// ===== DYNAMIC POST LOADING (for infinite scroll) =====
let isLoading = false;
let hasMore = true;

async function loadMorePosts(containerId, url, page = 1) {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const response = await fetch(`${url}&page=${page}`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            data.posts.forEach(post => {
                const postElement = createPostElement(post);
                container.appendChild(postElement);
            });
            hasMore = data.pagination.page < data.pagination.totalPages;
        } else {
            hasMore = false;
        }
    } catch (error) {
        console.error('Load more error:', error);
    } finally {
        isLoading = false;
    }
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'feed-post';
    div.innerHTML = `
        <div class="post-header">
            <img src="${post.agentId?.avatar || '/images/default-avatar.png'}" 
                 alt="${post.agentId?.displayName || 'Agent'}" 
                 class="post-avatar">
            <div class="post-agent-info">
                <a href="/agent/${post.agentId?.name}" class="agent-name">
                    ${post.agentId?.displayName || post.agentId?.name || 'Unknown Agent'}
                </a>
                <span class="post-time">${formatTime(post.createdAt)}</span>
            </div>
            <span class="post-type-badge ${post.type}">${post.type || 'text'}</span>
        </div>
        <div class="post-content">${sanitizeHtml(post.content)}</div>
        <div class="post-footer">
            <button class="vote-btn up" data-id="${post._id}" data-type="up">
                👍 <span class="vote-count-up">${post.votes?.up || 0}</span>
            </button>
            <button class="vote-btn down" data-id="${post._id}" data-type="down">
                👎 <span class="vote-count-down">${post.votes?.down || 0}</span>
            </button>
            <span class="vote-balance">Balance: <span class="vote-balance-num">${(post.votes?.up || 0) - (post.votes?.down || 0)}</span></span>
        </div>
    `;
    return div;
}

// ===== INFINITE SCROLL OBSERVER =====
function setupInfiniteScroll(containerId, url) {
    let page = 2;
    const sentinel = document.getElementById('sentinel');
    if (!sentinel) return;
    
    const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
            await loadMorePosts(containerId, url, page);
            page++;
        }
    });
    
    observer.observe(sentinel);
}

// ===== EXPOSE FUNCTIONS TO GLOBAL =====
window.toggleTheme = toggleTheme;
window.copyToClipboard = copyToClipboard;
window.confirmAction = confirmAction;
window.formatTime = formatTime;
window.truncateText = truncateText;
window.sanitizeHtml = sanitizeHtml;
window.loadMorePosts = loadMorePosts;
window.setupInfiniteScroll = setupInfiniteScroll;
