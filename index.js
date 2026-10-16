// Celeste Chapters, Checkpoints, and their Strawberry Index Ranges (inclusive [start, end])
const chapterCheckpoints = {
    "1": [
        { name: "Start", minBerry: 0, maxBerry: 5 },
        { name: "Crossing", minBerry: 6, maxBerry: 14 },
        { name: "Chasm", minBerry: 15, maxBerry: 19 }
    ],
    "2": [
        { name: "Start", minBerry: 0, maxBerry: 8 },
        { name: "Intervention", minBerry: 9, maxBerry: 16 },
        { name: "Awake", minBerry: 17, maxBerry: 17 }
    ],
    "3": [
        { name: "Start", minBerry: 0, maxBerry: 10 },
        { name: "Huge Mess", minBerry: 11, maxBerry: 17 },
        { name: "Elevator Shaft", minBerry: 18, maxBerry: 21 },
        { name: "Presidential Suite", minBerry: 22, maxBerry: 24 }
    ],
    "4": [
        { name: "Start", minBerry: 0, maxBerry: 7 },
        { name: "Shrine", minBerry: 8, maxBerry: 16 },
        { name: "Old Trail", minBerry: 17, maxBerry: 23 },
        { name: "Cliff Face", minBerry: 24, maxBerry: 28 }
    ],
    "5": [
        { name: "Start", minBerry: 0, maxBerry: 11 },
        { name: "Depths", minBerry: 12, maxBerry: 22 },
        { name: "Unraveling", minBerry: 23, maxBerry: 23 },
        { name: "Search", minBerry: 24, maxBerry: 29 },
        { name: "Rescue", minBerry: 30, maxBerry: 30 }
    ],
    "7": [
        { name: "Start", minBerry: 0, maxBerry: 3 },
        { name: "500 M", minBerry: 4, maxBerry: 9 },
        { name: "1000 M", minBerry: 10, maxBerry: 15 },
        { name: "1500 M", minBerry: 16, maxBerry: 23 },
        { name: "2000 M", minBerry: 24, maxBerry: 31 },
        { name: "2500 M", minBerry: 32, maxBerry: 39 },
        { name: "3000 M", minBerry: 40, maxBerry: 46 }
    ],
    "8": [
        { name: "Start", minBerry: null, maxBerry: null }, // No strawberries here!
        { name: "Into the Core", minBerry: 0, maxBerry: 0 },
        { name: "Hot and Cold", minBerry: 1, maxBerry: 3 },
        { name: "Heart of the Mountain", minBerry: 4, maxBerry: 4 }
    ]
};

// Total standard strawberries per chapter (n)
const chapterBerryCounts = {
    "1": 20, // 0 to 19
    "2": 18, // 0 to 17
    "3": 25, // 0 to 24
    "4": 29, // 0 to 28
    "5": 31, // 0 to 30
    "7": 47, // 0 to 46
    "8": 5,  // 0 to 4
};

// DOM Elements
const chapterSelect = document.getElementById('chapter-select');
const checkpointSelect = document.getElementById('checkpoint-select');
const berrySelect = document.getElementById('berry-select');
const submitBtn = document.getElementById('submit-btn');
const guessesBoard = document.getElementById('guesses-board');
const attemptsDisplay = document.getElementById('attempts-left');

// Game State Variables
const MAX_GUESSES = 6;
let guessCount = 0;
let isGameOver = false;
let guessHistory = []; // Tracks states for the shareable summary

// Get Today's Date String for Storage Keying
const getTodayString = () => new Date().toISOString().split('T')[0];

// Listen for changes on the Chapter dropdown
chapterSelect.addEventListener('change', function () {
    const selectedChapter = this.value;
    const checkpoints = chapterCheckpoints[selectedChapter] || [];
    const totalBerries = chapterBerryCounts[selectedChapter] || 0;

    // --- 1. Populate Checkpoints with definitions ---
    checkpointSelect.innerHTML = '';
    const defaultCpOption = document.createElement('option');
    defaultCpOption.value = '';
    defaultCpOption.disabled = true;
    defaultCpOption.selected = true;
    defaultCpOption.textContent = 'Select Checkpoint...';
    checkpointSelect.appendChild(defaultCpOption);

    checkpoints.forEach((cp, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${index} - ${cp.name}`;
        checkpointSelect.appendChild(option);
    });

    // --- 2. Populate Strawberry # (0 to n-1) ---
    berrySelect.innerHTML = '';
    const defaultBerryOption = document.createElement('option');
    defaultBerryOption.value = '';
    defaultBerryOption.disabled = true;
    defaultBerryOption.selected = true;
    defaultBerryOption.textContent = totalBerries > 0 ? 'Select Strawberry #' : 'No strawberries in this chapter!';
    berrySelect.appendChild(defaultBerryOption);

    for (let i = 0; i < totalBerries; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `#${i}`;
        berrySelect.appendChild(option);
    }
});

// --- DAILY TARGET GENERATOR ---
function getDailyTarget() {
    const today = getTodayString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }

    const chapters = Object.keys(chapterBerryCounts);
    const chapter = chapters[Math.abs(hash) % chapters.length];

    const checkpoints = chapterCheckpoints[chapter];
    const cpIdx = Math.abs(Math.floor(hash / 10)) % checkpoints.length;

    const cp = checkpoints[cpIdx];
    const berryNum = cp.minBerry + (Math.abs(Math.floor(hash / 100)) % (cp.maxBerry - cp.minBerry + 1));

    return { chapter: parseInt(chapter), checkpoint: cpIdx, berry: berryNum };
}

const target = getDailyTarget();

// --- GUESS SUBMISSION LOGIC ---
submitBtn.addEventListener('click', function () {
    if (isGameOver) return;

    const guessedChapter = parseInt(chapterSelect.value);
    const guessedCheckpoint = parseInt(checkpointSelect.value);
    const guessedBerry = parseInt(berrySelect.value);

    if (isNaN(guessedChapter) || isNaN(guessedCheckpoint) || isNaN(guessedBerry)) {
        alert("Please make a selection for Chapter, Checkpoint, and Strawberry #!");
        return;
    }

    guessCount++;
    attemptsDisplay.textContent = `Guesses: ${guessCount}/${MAX_GUESSES}`;

    const chapterResult = evaluateValue(guessedChapter, target.chapter);
    const checkpointResult = evaluateValue(guessedCheckpoint, target.checkpoint);
    const berryResult = evaluateValue(guessedBerry, target.berry);

    const guessData = {
        chapterText: `#${guessedChapter}`,
        chapterState: chapterResult.state,
        cpText: `#${guessedCheckpoint}`,
        cpState: checkpointResult.state,
        berryText: `#${guessedBerry}`,
        berryState: berryResult.state
    };

    guessHistory.push(guessData);
    renderGuessRow(guessData);

    const won = (chapterResult.state === 'correct' && checkpointResult.state === 'correct' && berryResult.state === 'correct');

    // Save progress to localStorage immediately
    saveGameState(won);

    if (won) {
        endGame(true);
    } else if (guessCount >= MAX_GUESSES) {
        endGame(false);
    }
});

// --- PERSISTENCE & LOCKOUT STORAGE ---
function saveGameState(won) {
    const today = getTodayString();
    const gameState = {
        guessCount,
        isGameOver,
        won,
        guessHistory
    };
    localStorage.setItem(`strawble_${today}`, JSON.stringify(gameState));
}

function updateDayCounter() {
    const anchorDate = new Date('2026-10-14');
    const todayStr = getTodayString(); // uses your existing YYYY-MM-DD function
    const todayDate = new Date(todayStr);

    // Calculate difference in milliseconds and convert to days
    const diffTime = todayDate - anchorDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const dayCounterElement = document.getElementById('day-counter');
    if (dayCounterElement) {
        dayCounterElement.textContent = `Day #${diffDays}`;
    }
}

function loadSavedGameState() {
    const today = getTodayString();
    const savedData = localStorage.getItem(`strawble_${today}`);
    if (!savedData) return false;

    try {
        const state = JSON.parse(savedData);
        guessCount = state.guessCount;
        isGameOver = state.isGameOver;
        guessHistory = state.guessHistory || [];

        attemptsDisplay.textContent = `Guesses: ${guessCount}/${MAX_GUESSES}`;

        // Clear placeholder and render history
        guessesBoard.innerHTML = '';
        guessHistory.forEach(guess => renderGuessRow(guess));

        if (isGameOver) {
            lockdownUI(state.won);
        }
        return true;
    } catch (e) {
        console.error("Failed to parse saved game state:", e);
        return false;
    }
}

// Must match the salt used in your Python build script!
const SALT = "aVacqx33IzF/v3Ipl7PoMPjVLzxWB6tAW3Cs6Si092gkqoZd7FWhQ0lGS5WKJCw+H6M=";

async function getBerryImageUrl(chapter, berryIndex) {
    const message = `${chapter}-${berryIndex}-${SALT}`;
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `public/assets/berries/${hashHex.substring(0, 16)}.png`;
}

// --- LIGHTBOX INTERACTION ---
const hintImgElement = document.getElementById("daily-berry-img");
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxImg = document.getElementById("lightbox-img");

if (hintImgElement && lightboxModal && lightboxImg) {
    // Open lightbox on hint image click
    hintImgElement.addEventListener('click', () => {
        if (!hintImgElement.classList.contains('hidden') && hintImgElement.src) {
            lightboxImg.src = hintImgElement.src;
            lightboxModal.classList.remove('hidden');
        }
    });

    // Close lightbox on click anywhere on the overlay
    lightboxModal.addEventListener('click', () => {
        lightboxModal.classList.add('hidden');
    });
}

function evaluateValue(guess, actual) {
    if (guess === actual) return { state: 'correct' };
    if (guess < actual) return { state: 'higher' };
    return { state: 'lower' };
}

function renderGuessRow(data) {
    if (guessCount === 1 && guessesBoard.querySelector('.tile.empty')) {
        guessesBoard.innerHTML = '';
    }

    const row = document.createElement('div');
    row.className = 'guess-row three-cols';

    row.innerHTML = `
        <div class="tile ${data.chapterState}">
            ${data.chapterText} ${getArrow(data.chapterState)}
        </div>
        <div class="tile ${data.cpState}">
            ${data.cpText} ${getArrow(data.cpState)}
        </div>
        <div class="tile ${data.berryState}">
            ${data.berryText} ${getArrow(data.berryState)}
        </div>
    `;

    guessesBoard.appendChild(row);
}

function getArrow(state) {
    if (state === 'higher') return ' ⬆️';
    if (state === 'lower') return ' ⬇️';
    if (state === 'correct') return ' ⭐';
    return '';
}

function endGame(won) {
    isGameOver = true;
    saveGameState(won);
    lockdownUI(won);
}

function lockdownUI(won) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    chapterSelect.disabled = true;
    checkpointSelect.disabled = true;
    berrySelect.disabled = true;

    // Prevent duplicate banners if reloading an already ended game
    if (document.getElementById('endgame-banner')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'endgame-banner';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '10px';
    wrapper.style.width = '100%';
    wrapper.style.marginTop = '10px';

    const message = document.createElement('div');
    message.style.textAlign = 'center';
    message.style.fontWeight = 'bold';
    message.style.color = won ? '#10b981' : '#ef4444';
    message.textContent = won ? '🎉 You found the strawberry!' : `❌ Game Over! Target was Ch. ${target.chapter}, Checkpoint ${target.checkpoint}, Berry #${target.berry}.`;
    wrapper.appendChild(message);

    // --- COUNTDOWN ELEMENT ---
    const countdownContainer = document.createElement('div');
    countdownContainer.style.fontSize = '0.85rem';
    countdownContainer.style.color = '#94a3b8';
    countdownContainer.style.marginTop = '2px';
    countdownContainer.innerHTML = `Next Strawble in: <span id="countdown-timer" style="color: #f8fafc; font-weight: bold;">--:--:--</span>`;
    wrapper.appendChild(countdownContainer);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'retro-btn share-btn';
    shareBtn.textContent = 'SHARE RESULTS';

    shareBtn.addEventListener('click', () => {
        const shareText = generateShareText(won);
        navigator.clipboard.writeText(shareText).then(() => {
            shareBtn.textContent = 'COPIED TO CLIPBOARD!';
            setTimeout(() => {
                shareBtn.textContent = 'SHARE RESULTS';
            }, 2000);
        });
    });
    wrapper.appendChild(shareBtn);

    document.querySelector('.container').appendChild(wrapper);

    // Start the live countdown loop
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// --- SHARE TEXT GENERATOR ---
function generateShareText(won) {
    const score = won ? guessCount : 'X';

    // Calculate current day number using the same anchor date (2026-10-14 as Day #0)
    const anchorDate = new Date('2026-10-14');
    const todayDate = new Date(getTodayString());
    const diffTime = todayDate - anchorDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let text = `Strawble #${diffDays} ${score}/${MAX_GUESSES}\n\n`;

    guessHistory.forEach(guess => {
        const cEmoji = emojiForState(guess.chapterState);
        const cpEmoji = emojiForState(guess.cpState);
        const bEmoji = emojiForState(guess.berryState);
        text += `${cEmoji}${cpEmoji}${bEmoji}\n`;
    });

    // Append the dynamic current URL at the bottom
    text += `\n${window.location.href}`;

    return text.trim();
}

function emojiForState(state) {
    if (state === 'correct') return '🟩';
    if (state === 'higher') return '⬆️';
    if (state === 'lower') return '⬇️';
    return '⬛';
}

document.addEventListener("DOMContentLoaded", async () => {
    // Update the dynamic day number
    updateDayCounter();

    try {
        const imgUrl = await getBerryImageUrl(target.chapter, target.berry);
        const imgElement = document.getElementById("daily-berry-img");
        if (imgElement) {
            imgElement.src = imgUrl;
            imgElement.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Failed to load daily berry hint image:", err);
    }

    // Load any saved game state for today
    loadSavedGameState();
});

// --- LIVE COUNTDOWN TIMER ---
function updateCountdown() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const now = new Date();
    // Get current time in UTC milliseconds
    const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
    // Get tomorrow's midnight in UTC milliseconds
    const tomorrowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);

    const diff = tomorrowUtc - nowUtc;

    if (diff <= 0) {
        timerEl.textContent = "00:00:00";
        return;
    }

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}