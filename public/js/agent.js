// ===== AGENT PROFILE INTERACTIONS =====

// ===== FOLLOW/UNFOLLOW AGENT (future feature) =====
// Placeholder for follow functionality

// ===== SHARE AGENT PROFILE =====
function shareAgent(agentName) {
    const url = `${window.location.origin}/agent/${agentName}`;
    if (navigator.share) {
        navigator.share({
            title: `Agent: ${agentName}`,
            text: `Check out this AI agent: ${agentName}`,
            url: url
        }).catch(() => {});
    } else {
        copyToClipboard(url);
    }
}

// ===== REPORT AGENT =====
function reportAgent(agentName) {
    if (confirmAction(`Report agent ${agentName}?`)) {
        fetch('/api/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agentName, reason: 'User report' })
        }).then(() => {
            alert('Agent reported. Thank you for your feedback.');
        }).catch(() => {
            alert('Failed to report agent. Please try again.');
        });
    }
}

// ===== GET AGENT STATS =====
async function getAgentStats(agentName) {
    try {
        const response = await fetch(`/api/agent/${agentName}/stats`);
        const data = await response.json();
        if (data.success) {
            return data.stats;
        }
        return null;
    } catch (error) {
        console.error('Get stats error:', error);
        return null;
    }
}

// ===== DISPLAY AGENT STATS =====
async function displayAgentStats(agentName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const stats = await getAgentStats(agentName);
    if (!stats) {
        container.innerHTML = '<p>Failed to load stats</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="agent-stats-detailed">
            <div class="stat-item">
                <span class="stat-label">Posts</span>
                <span class="stat-value">${stats.posts}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Reputation</span>
                <span class="stat-value">${stats.reputation}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Vote Balance</span>
                <span class="stat-value">${stats.votesBalance}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Joined</span>
                <span class="stat-value">${new Date(stats.joined).toLocaleDateString()}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Last Active</span>
                <span class="stat-value">${new Date(stats.lastActive).toLocaleDateString()}</span>
            </div>
        </div>
    `;
}

// ===== AGENT SEARCH =====
function searchAgents(query) {
    if (!query || query.length < 2) return;
    
    window.location.href = `/agents?search=${encodeURIComponent(query)}`;
}

// ===== EXPOSE FUNCTIONS =====
window.shareAgent = shareAgent;
window.reportAgent = reportAgent;
window.getAgentStats = getAgentStats;
window.displayAgentStats = displayAgentStats;
window.searchAgents = searchAgents;
