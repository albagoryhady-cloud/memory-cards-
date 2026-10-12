// تعريف الطوابع (Themes) حسب نطاق المراحل والأيقونات الخاصة بها
const themes = [
    {
        name: "عصور وسطى 🏰",
        minLevel: 1, maxLevel: 5,
        emojis: ['🏰', '⚔️', '👑', '🛡️', '🐉', '🐴', '📜', '🏹', '🧙‍♂️', '🪙', '💎', '🔮', '🗡️', '👑', '🗝️']
    },
    {
        name: "أعماق المحيط 🌊",
        minLevel: 6, maxLevel: 10,
        emojis: ['🌊', '⛵', '🐙', '🦈', '🐬', '🦀', '⚓', '🏝️', '🐳', '🐠', '🧜‍♀️', '🐚', '🦭', '🪼', '🚢']
    },
    {
        name: "الغابة البرية 🦁",
        minLevel: 11, maxLevel: 15,
        emojis: ['🦁', '🐯', '🐘', '🦒', '🐵', '🐍', '🌴', '🦓', '🦏', '🦜', '🦩', '🐆', '🐻', '🐺', '🦉']
    },
    {
        name: "عالم الفضاء 🚀",
        minLevel: 16, maxLevel: 20,
        emojis: ['🚀', '🛸', '👨‍🚀', '🪐', '🌙', '⭐', '☄️', '🌌', '👽', '🛰️', '🔭', '☀️', '🌍', '👾', '✨']
    }
];

let currentLevel = 1;
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let targetPairs = 5; // تبدأ بـ 5 أزواج (10 كروت في المرحلة 1)
let moves = 0;
let gameStarted = false;
let timerInterval = null;
let secondsElapsed = 0;
let lockBoard = false;

// عناصر الواجهة
const levelTitle = document.getElementById('level-title');
const themeBadge = document.getElementById('theme-badge');
const lbRecord = document.getElementById('lb-record');
const gridContainer = document.getElementById('grid-container');
const movesDisplay = document.getElementById('moves-count');
const timerDisplay = document.getElementById('timer');
const matchesDisplay = document.getElementById('matches-count');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'flip') {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'match') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.setValueAtTime(700, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'win') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
            osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        }
    } catch (e) {}
}

// تحضير وتطابق المرحلة
function initLevel() {
    // حساب عدد الأزواج (المرحلة 1 = 5 أزواج/10 كروت، المرحلة 2 = 6 أزواج/12 كارت...)
    targetPairs = 4 + currentLevel;
    
    // إيجاد الطابع المناسب للمرحلة
    let currentTheme = themes.find(t => currentLevel >= t.minLevel && currentLevel <= t.maxLevel);
    if (!currentTheme) currentTheme = themes[themes.length - 1]; // في حالة تجاوز المرحلة 20

    levelTitle.textContent = `المرحلة ${currentLevel}`;
    themeBadge.textContent = currentTheme.name;

    // استخراج الإيموجيز المطلوبة لهذه المرحلة
    const selectedEmojis = currentTheme.emojis.slice(0, targetPairs);
    cards = [...selectedEmojis, ...selectedEmojis];
    shuffle(cards);

    // ضبط الشبكة برمجياً حسب عدد الكروت
    const totalCards = cards.length;
    let cols = 5;
    if (totalCards <= 10) cols = 5;
    else if (totalCards <= 12) cols = 4;
    else if (totalCards <= 16) cols = 4;
    else if (totalCards <= 20) cols = 5;
    else cols = 6;

    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.innerHTML = '';

    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    secondsElapsed = 0;
    gameStarted = false;
    lockBoard = false;

    movesDisplay.textContent = moves;
    matchesDisplay.textContent = `0 / ${targetPairs}`;
    timerDisplay.textContent = '00:00';
    clearInterval(timerInterval);

    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.emoji = emoji;

        card.innerHTML = `
            <div class="card-face card-back">❓</div>
            <div class="card-face card-front">${emoji}</div>
        `;

        card.addEventListener('click', flipCard);
        gridContainer.appendChild(card);
    });

    loadLeaderboard();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function flipCard() {
    if (lockBoard) return;
    if (this.classList.contains('flipped') || this.classList.contains('matched')) return;

    if (!gameStarted) {
        startTimer();
        gameStarted = true;
    }

    playSound('flip');
    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    const [card1, card2] = flippedCards;
    card1.classList.add('matched');
    card2.classList.add('matched');

    matchedPairs++;
    matchesDisplay.textContent = `${matchedPairs} / ${targetPairs}`;
    playSound('match');

    flippedCards = [];

    if (matchedPairs === targetPairs) {
        handleLevelWin();
    }
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        flippedCards = [];
        lockBoard = false;
    }, 800);
}

function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

// معالجة الرقم القياسي والـ Leaderboard للمرحلة
function loadLeaderboard() {
    const savedRecord = localStorage.getItem(`memory_lb_lvl_${currentLevel}`);
    if (savedRecord) {
        const data = JSON.parse(savedRecord);
        lbRecord.textContent = `👑 ${data.name} - ⏱️ ${data.timeStr} - 🎯 ${data.moves} محاولة`;
    } else {
        lbRecord.textContent = "لا يوجد رقم قياسي بعد - كن الأول!";
    }
}

function checkAndSaveLeaderboard() {
    const savedRecord = localStorage.getItem(`memory_lb_lvl_${currentLevel}`);
    let isNewRecord = false;
    const timeStr = timerDisplay.textContent;

    if (!savedRecord) {
        isNewRecord = true;
    } else {
        const data = JSON.parse(savedRecord);
        if (secondsElapsed < data.seconds || (secondsElapsed === data.seconds && moves < data.moves)) {
            isNewRecord = true;
        }
    }

    if (isNewRecord) {
        setTimeout(() => {
            const playerName = prompt(`🎉 أداء مذهل! حققت رقماً قياسياً جديداً للمرحلة ${currentLevel}!\nأدخل اسمك لتسجيله في قائمة الأبطال:`) || "بطل مجهول";
            const newRecord = {
                name: playerName,
                seconds: secondsElapsed,
                timeStr: timeStr,
                moves: moves
            };
            localStorage.setItem(`memory_lb_lvl_${currentLevel}`, JSON.stringify(newRecord));
            loadLeaderboard();
        }, 600);
    }
}

function handleLevelWin() {
    clearInterval(timerInterval);
    playSound('win');

    if (typeof confetti === 'function') {
        confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
    }

    checkAndSaveLeaderboard();

    setTimeout(() => {
        if (confirm(`🎉 أحسنت! أكملت المرحلة ${currentLevel} بنجاح!\nهل تريد الانتقال إلى المرحلة ${currentLevel + 1}؟`)) {
            currentLevel++;
            initLevel();
        }
    }, 1200);
}

function changeLevel(delta) {
    if (currentLevel + delta < 1) return;
    currentLevel += delta;
    initLevel();
}

function restartLevel() {
    initLevel();
}

// بدء التشغيل
initLevel();
