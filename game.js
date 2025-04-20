// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const bgMusic = document.getElementById('bg-music');
const musicToggle = document.getElementById('music-toggle');

// Set canvas size
canvas.width = 360;
canvas.height = 640;

// Control settings
let targetX = null; // X-координата цели для движения
const MOVE_SPEED = 0.1; // Скорость приближения к цели (0.1 = 10% за кадр)
const MAX_STEP = 6; // Максимальная скорость перемещения

// Game state
let gameRunning = false;
let score = 0;
let highScore = 0;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    dy: 0,
    gravity: 0.4,
    jumpForce: -12,
    isJumping: false,
    image: new Image()
};
player.image.src = 'assets/hero.png';

// Platform types
const PLATFORM_TYPES = {
    NORMAL: 0,
    BREAKABLE: 1
};

// Create platform textures
function createPlatformTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 45;
    canvas.height = 15;
    const ctx = canvas.getContext('2d');
    
    if (type === PLATFORM_TYPES.NORMAL) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, 45, 15);
        ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(i * 9, 12, 8, 3);
        }
    } else {
        ctx.fillStyle = '#F44336';
        ctx.fillRect(0, 0, 45, 15);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, 5);
        ctx.lineTo(15, 10);
        ctx.lineTo(25, 3);
        ctx.lineTo(35, 8);
        ctx.lineTo(40, 2);
        ctx.stroke();
    }
    return canvas;
}

// Background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#E0F7FA');
    gradient.addColorStop(1, '#B2EBF2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 100 + score / 3) % (canvas.width + 100) - 50;
        const y = (i * 80) % (canvas.height / 2);
        drawCloud(x, y, 30 + i * 5);
    }
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

// Platforms
let platforms = [];
const PLATFORM_COUNT = 15;
const PLATFORM_WIDTH = 45;
const PLATFORM_HEIGHT = 15;

const platformTextures = {
    [PLATFORM_TYPES.NORMAL]: createPlatformTexture(PLATFORM_TYPES.NORMAL),
    [PLATFORM_TYPES.BREAKABLE]: createPlatformTexture(PLATFORM_TYPES.BREAKABLE)
};

function generatePlatforms() {
    platforms = [];
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: PLATFORM_TYPES.NORMAL
    });
    
    const verticalStep = (canvas.height - 100) / (PLATFORM_COUNT - 1);
    for (let i = 0; i < PLATFORM_COUNT; i++) {
        const y = Math.max(50, i * verticalStep + (Math.random() * 50 - 25));
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: Math.random() > 0.8 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL
        });
    }
}

function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(
            platformTextures[platform.type],
            platform.x, platform.y,
            platform.width, platform.height
        );
    });
}

function checkPlatformCollision() {
    const playerBottom = player.y + player.height;
    const playerCenter = player.x + player.width / 2;
    
    platforms.forEach((platform, index) => {
        if (playerBottom <= platform.y + platform.height &&
            playerBottom >= platform.y &&
            player.dy > 0 &&
            playerCenter >= platform.x &&
            playerCenter <= platform.x + platform.width) {
            
            player.dy = player.jumpForce;
            player.isJumping = false;
            
            if (platform.type === PLATFORM_TYPES.BREAKABLE) {
                setTimeout(() => {
                    platforms.splice(index, 1);
                    platforms.push({
                        x: Math.random() * (canvas.width - PLATFORM_WIDTH),
                        y: -50,
                        width: PLATFORM_WIDTH,
                        height: PLATFORM_HEIGHT,
                        type: Math.random() > 0.8 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL
                    });
                }, 100);
            }
        }
    });
}

function updatePlayer() {
    player.dy += player.gravity;
    player.y += player.dy;
    
    // Плавное движение к цели
    if (targetX !== null) {
        const targetCenter = targetX - player.width/2;
        const distance = targetCenter - player.x;
        let step = distance * MOVE_SPEED;
        
        // Ограничиваем максимальную скорость
        if (Math.abs(step) > MAX_STEP) {
            step = Math.sign(step) * MAX_STEP;
        }
        
        player.x += step;
    }
    
    // Screen wrapping
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;
    
    // Game over if fall
    if (player.y > canvas.height) gameOver();
    
    // Camera follow
    if (player.y < canvas.height / 3) {
        const diff = canvas.height / 3 - player.y;
        player.y = canvas.height / 3;
        
        platforms.forEach(platform => {
            platform.y += diff;
            if (platform.y > canvas.height) {
                platform.y = -platform.height;
                platform.x = Math.random() * (canvas.width - platform.width);
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;
            }
        });
    }
    
    checkPlatformCollision();
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updatePlayer();
    drawPlatforms();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (musicToggle.checked) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.dy = 0;
    targetX = null;
    
    generatePlatforms();
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    if (score > highScore) highScore = score;
}

// Touch controls (move to target)
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    targetX = e.touches[0].clientX - rect.left;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    targetX = e.touches[0].clientX - rect.left;
});

canvas.addEventListener('touchend', () => {
    targetX = null;
});

// Mouse controls (for testing on desktop)
canvas.addEventListener('mousedown', (e) => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    targetX = e.clientX - rect.left;
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning || e.buttons !== 1) return;
    const rect = canvas.getBoundingClientRect();
    targetX = e.clientX - rect.left;
});

canvas.addEventListener('mouseup', () => {
    targetX = null;
});

// Keyboard controls (left/right for desktop)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        targetX = player.x - 50;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        targetX = player.x + 50;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || 
        e.key === 'ArrowRight' || e.key === 'd') {
        targetX = null;
    }
});

// Music control
musicToggle.addEventListener('change', function() {
    if (this.checked && gameRunning) {
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    } else {
        bgMusic.pause();
    }
});

// Start buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Init
window.onload = () => {
    startScreen.style.display = 'flex';
};
