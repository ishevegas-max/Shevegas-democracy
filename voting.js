// SheVegas Direct Democracy - Voting Logic
// Handles vote submission, verification, and live results

(function() {
‘use strict’;

```
// Configuration
const CONFIG = {
    apiEndpoint: '/api/vote', // Will be set up later
    storageKey: 'shevegas_voted_items',
    ballotId: 'jan-19-2026-council' // Unique ID for this ballot
};

// State
let currentVote = {
    item: null,
    vote: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupVoteButtons();
    setupModal();
    setupSubscribeForm();
    loadPreviousVotes();
    // In production, would load live results from server
    simulateLiveResults(); // For demo purposes
}

// Set up vote button listeners
function setupVoteButtons() {
    const voteButtons = document.querySelectorAll('.vote-btn');
    
    voteButtons.forEach(button => {
        button.addEventListener('click', handleVoteClick);
    });
}

// Handle vote button click
function handleVoteClick(e) {
    const button = e.currentTarget;
    const itemId = button.dataset.item;
    const voteType = button.dataset.vote;

    // Check if already voted
    if (hasVotedOnItem(itemId)) {
        alert('You\'ve already voted on this item. Each person gets one vote per item.');
        return;
    }

    // Store vote data
    currentVote = {
        item: itemId,
        vote: voteType
    };

    // Show verification modal
    showModal();
}

// Modal handling
function setupModal() {
    const modal = document.getElementById('verifyModal');
    const form = document.getElementById('verifyForm');
    const cancelBtn = document.getElementById('cancelVerify');

    form.addEventListener('submit', handleVoteSubmit);
    cancelBtn.addEventListener('click', hideModal);

    // Close modal if clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}

function showModal() {
    const modal = document.getElementById('verifyModal');
    modal.classList.add('active');
}

function hideModal() {
    const modal = document.getElementById('verifyModal');
    modal.classList.remove('active');
    document.getElementById('verifyForm').reset();
}

// Handle vote submission
async function handleVoteSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('voterEmail').value;

    // Basic email validation
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    try {
        // In production, this would send to server
        // For now, simulate successful vote
        await submitVote(currentVote.item, currentVote.vote, email);

        // Mark as voted
        markItemAsVoted(currentVote.item);

        // Update UI
        updateVoteButton(currentVote.item, currentVote.vote);
        updateResults(currentVote.item, currentVote.vote);

        // Hide modal
        hideModal();

        // Show success message
        showNotification('✅ Vote recorded! Thank you for participating.', 'success');

    } catch (error) {
        console.error('Vote submission error:', error);
        showNotification('❌ Error recording vote. Please try again.', 'error');
    }
}

// Submit vote (would be API call in production)
async function submitVote(itemId, voteType, email) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, would POST to server:
    // const response = await fetch(CONFIG.apiEndpoint, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ itemId, voteType, email, ballotId: CONFIG.ballotId })
    // });
    // return response.json();

    console.log('Vote submitted:', { itemId, voteType, email });
    return { success: true };
}

// Email validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Local storage for tracking votes
function hasVotedOnItem(itemId) {
    const voted = getVotedItems();
    return voted.includes(itemId);
}

function markItemAsVoted(itemId) {
    const voted = getVotedItems();
    voted.push(itemId);
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(voted));
}

function getVotedItems() {
    const stored = localStorage.getItem(CONFIG.storageKey);
    return stored ? JSON.parse(stored) : [];
}

function loadPreviousVotes() {
    const voted = getVotedItems();
    voted.forEach(itemId => {
        const buttons = document.querySelectorAll(`[data-item="${itemId}"]`);
        buttons.forEach(btn => btn.disabled = true);
    });
}

// Update button visual state
function updateVoteButton(itemId, voteType) {
    const buttons = document.querySelectorAll(`[data-item="${itemId}"]`);
    
    buttons.forEach(btn => {
        if (btn.dataset.vote === voteType) {
            btn.classList.add('selected');
        }
        btn.disabled = true;
    });
}

// Update live results (demo version)
function updateResults(itemId, voteType) {
    const resultsDiv = document.getElementById(`results-${itemId}`);
    if (!resultsDiv) return;

    // In production, would fetch from server
    // For demo, increment local counter
    const countSpan = resultsDiv.querySelector(`.${voteType}-count strong`);
    const totalSpan = resultsDiv.querySelector('.total-votes strong');
    
    if (countSpan && totalSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        const currentTotal = parseInt(totalSpan.textContent) || 0;
        
        countSpan.textContent = currentCount + 1;
        totalSpan.textContent = currentTotal + 1;

        // Update bar chart
        updateResultsBar(itemId);
    }
}

// Update results bar visualization
function updateResultsBar(itemId) {
    const resultsDiv = document.getElementById(`results-${itemId}`);
    if (!resultsDiv) return;

    const approveCount = parseInt(resultsDiv.querySelector('.approve-count strong').textContent) || 0;
    const denyCount = parseInt(resultsDiv.querySelector('.deny-count strong').textContent) || 0;
    const total = approveCount + denyCount;

    if (total === 0) return;

    const approvePercent = (approveCount / total) * 100;
    const denyPercent = (denyCount / total) * 100;

    const approveBar = resultsDiv.querySelector('.bar-segment.approve');
    const denyBar = resultsDiv.querySelector('.bar-segment.deny');

    if (approveBar && denyBar) {
        approveBar.style.width = `${approvePercent}%`;
        denyBar.style.width = `${denyPercent}%`;

        // Show percentage if bar is wide enough
        if (approvePercent > 15) {
            approveBar.textContent = `${Math.round(approvePercent)}%`;
        }
        if (denyPercent > 15) {
            denyBar.textContent = `${Math.round(denyPercent)}%`;
        }
    }
}

// Simulate live results for demo
function simulateLiveResults() {
    // In production, this would be real-time data from server
    // For demo, show some sample votes
    const sampleData = {
        '1': { approve: 47, deny: 23, abstain: 8 },
        '2': { approve: 62, deny: 15, abstain: 5 }
    };

    Object.entries(sampleData).forEach(([itemId, votes]) => {
        const resultsDiv = document.getElementById(`results-${itemId}`);
        if (!resultsDiv) return;

        // Update counts
        resultsDiv.querySelector('.approve-count strong').textContent = votes.approve;
        resultsDiv.querySelector('.deny-count strong').textContent = votes.deny;
        resultsDiv.querySelector('.abstain-count strong').textContent = votes.abstain;
        resultsDiv.querySelector('.total-votes strong').textContent = 
            votes.approve + votes.deny + votes.abstain;

        // Update bar
        updateResultsBar(itemId);
    });
}

// Subscribe form handling
function setupSubscribeForm() {
    const form = document.getElementById('subscribeForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = form.querySelector('input[type="email"]').value;
        
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        try {
            // In production, would submit to email service
            await new Promise(resolve => setTimeout(resolve, 500));
            
            showNotification('✅ Subscribed! You\'ll get notifications when new ballots are published.', 'success');
            form.reset();
        } catch (error) {
            showNotification('Error subscribing. Please try again.', 'error');
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style it
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        backgroundColor: type === 'success' ? '#06d6a0' : type === 'error' ? '#ef476f' : '#4A9ECC',
        color: '#ffffff',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease',
        maxWidth: '300px'
    });

    // Add to page
    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
```

})();