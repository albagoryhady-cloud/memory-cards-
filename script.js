// قائمة الأيقونات (8 أزواج = 16 كارت)
const emojis = ['🚀', '🍕', '🎮', '🦁', '🌟', '🎨', '💎', '🍦'];

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameStarted = false;
let timerInterval = null;
let secondsElapsed = 0;
let lockBoard = false;

const gridContainer = document.getElementById('grid-container');
const movesDisplay = document.getElementById('moves-count');
const timerDisplay = document.getElementById('timer');
const matchesDisplay = document.getElementById('matches-count');

// توليد الصوت برمجياً بدون ملفات خارجية
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

// إنشاء اللوحة وتخليط الكروت
function initGame() {
    cards = [...emojis, ...emojis]; // خلط الأيقونات لعمل 8 أزواج
    shuffle(cards);

    gridContainer.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    secondsElapsed = 0;
    gameStarted = false;
    lockBoard = false;

    movesDisplay.textContent = moves;
    matchesDisplay.textContent = `0 / ${emojis.length}`;
    timerDisplay.textContent = '00:00';
    clearInterval(timerInterval);

    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.emoji = emoji;
        card.dataset.index = index;

        card.innerHTML = `
            <div class="card-face card-back">❓</div>
            <div class="card-face card-front">${emoji}</div>
        `;

        card.addEventListener('click', flipCard);
        gridContainer.appendChild(card);
    });
}

// خوارزمية الخلط العشوائي (Fisher-Yates)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// عند ضغط الكارت
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

// فحص التطابق
function checkMatch() {
    const [card1, card2] = flippedCards;
    const isMatch = card1.dataset.emoji === card2.dataset.emoji;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

// في حالة المطابقة الصحيحة
function disableCards() {
    const [card1, card2] = flippedCards;
    card1.classList.add('matched');
    card2.classList.add('matched');

    matchedPairs++;
    matchesDisplay.textContent = `${matchedPairs} / ${emojis.length}`;
    playSound('match');

    flippedCards = [];

    if (matchedPairs === emojis.length) {
        handleWin();
    }
}

// في حالة عدم المطابقة (إعادة القلب)
function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        flippedCards = [];
        lockBoard = false;
    }, 900);
}

// العداد الزمني
function startTimer() {
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);
}

// الاحتفال بالفوز
function handleWin() {
    clearInterval(timerInterval);
    playSound('win');

    if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }

    setTimeout(() => {
        alert(`🎉 مبروك! أنهيت اللعبة في ${moves} محاولة وخلال وقت ${timerDisplay.textContent}!`);
    }, 500);
}

function restartGame() {
    initGame();
}

// تشغيل اللعبة فور تحميل الصفحة
initGame();
