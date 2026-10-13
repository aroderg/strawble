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

    // Allow choosing any index from 0 to n-1 across the entire chapter
    for (let i = 0; i < totalBerries; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `#${i}`;
        berrySelect.appendChild(option);
    }
});

// --- DAILY TARGET GENERATOR ---
function getDailyTarget() {
    const today = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }

    const chapters = Object.keys(chapterBerryCounts);
    const chapter = chapters[Math.abs(hash) % chapters.length];

    const checkpoints = chapterCheckpoints[chapter];
    const cpIdx = Math.abs(Math.floor(hash / 10)) % checkpoints.length;

    // Pick a random strawberry index strictly within that checkpoint's official range
    const cp = checkpoints[cpIdx];
    const berryNum = cp.minBerry + (Math.abs(Math.floor(hash / 100)) % (cp.maxBerry - cp.minBerry + 1));

    return { chapter: parseInt(chapter), checkpoint: cpIdx, berry: berryNum };
}

const target = getDailyTarget();
console.log("Secret Target (for testing):", target); // Remove in production

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

    // Track for shareable results
    guessHistory.push({
        chapterState: chapterResult.state,
        cpState: checkpointResult.state,
        berryState: berryResult.state
    });

    renderGuessRow({
        chapterText: `#${guessedChapter}`,
        chapterState: chapterResult.state,
        cpText: `#${guessedCheckpoint}`,
        cpState: checkpointResult.state,
        berryText: `#${guessedBerry}`,
        berryState: berryResult.state
    });

    if (chapterResult.state === 'correct' && checkpointResult.state === 'correct' && berryResult.state === 'correct') {
        endGame(true);
    } else if (guessCount >= MAX_GUESSES) {
        endGame(false);
    }
});

// Must match the salt used in your Python build script!
const SALT = "aVacqx33IzF/v3Ipl7PoMPjVLzxWB6tAW3Cs6Si092gkqoZd7FWhQ0lGS5WKJCw+H6M=";

async function getBerryImageUrl(chapter, berryIndex) {
    // Construct the exact same message string (Chapter and Global Berry Index)
    const message = `${chapter}-${berryIndex}-${SALT}`;

    // Encode and hash using the browser's native Web Crypto API
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Return the path to the hashed asset
    return `public/assets/berries/${hashHex.substring(0, 16)}.png`;
}

function evaluateValue(guess, actual) {
    if (guess === actual) return { state: 'correct' };
    if (guess < actual) return { state: 'higher' }; // Target is higher
    return { state: 'lower' }; // Target is lower
}

function renderGuessRow(data) {
    if (guessCount === 1) {
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
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    const message = document.createElement('div');
    message.style.textAlign = 'center';
    message.style.marginTop = '10px';
    message.style.fontWeight = 'bold';
    message.style.color = won ? '#10b981' : '#ef4444';
    message.textContent = won ? '🎉 You found the strawberry!' : `❌ Game Over! Target was Ch. ${target.chapter}, Checkpoint ${target.checkpoint}, Berry #${target.berry}.`;

    document.querySelector('.container').appendChild(message);

    // --- SHARE BUTTON ---
    const shareBtn = document.createElement('button');
    shareBtn.className = 'retro-btn share-btn';
    shareBtn.textContent = 'SHARE RESULTS';
    shareBtn.style.marginTop = '10px';

    shareBtn.addEventListener('click', () => {
        const shareText = generateShareText(won);
        navigator.clipboard.writeText(shareText).then(() => {
            shareBtn.textContent = 'COPIED TO CLIPBOARD!';
            setTimeout(() => {
                shareBtn.textContent = 'SHARE RESULTS';
            }, 2000);
        });
    });

    document.querySelector('.container').appendChild(shareBtn);
}

// --- SHARE TEXT GENERATOR ---
function generateShareText(won) {
    const score = won ? guessCount : 'X';
    let text = `Strawble ${score}/${MAX_GUESSES}\n\n`;

    guessHistory.forEach(guess => {
        const cEmoji = emojiForState(guess.chapterState);
        const cpEmoji = emojiForState(guess.cpState);
        const bEmoji = emojiForState(guess.berryState);
        text += `${cEmoji}${cpEmoji}${bEmoji}\n`;
    });

    return text.trim();
}

function emojiForState(state) {
    if (state === 'correct') return '🟩';
    if (state === 'higher') return '⬆️';
    if (state === 'lower') return '⬇️';
    return '⬛';
}

document.addEventListener("DOMContentLoaded", async () => {
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
});