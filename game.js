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
canvas.width = 720;
canvas.height = 1280;

// Game state
let gameRunning = false;
let score = 0;
let highScore = 0;
let touchX = null;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    speed: 6,
    dx: 0,
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
        // Green platform
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, 45, 15);
        ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(i * 9, 12, 8, 3);
        }
    } else {
        // Red breakable platform
        ctx.fillStyle = '#F44336';
        ctx.fillRect(0, 0, 45, 15);
        // Crack effect
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

// Background gradient with clouds
function drawBackground() {
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#E0F7FA');
    gradient.addColorStop(1, '#B2EBF2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
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

// Platform textures
const platformTextures = {
    [PLATFORM_TYPES.NORMAL]: createPlatformTexture(PLATFORM_TYPES.NORMAL),
    [PLATFORM_TYPES.BREAKABLE]: createPlatformTexture(PLATFORM_TYPES.BREAKABLE)
};

// Generate platforms
function generatePlatforms() {
    platforms = [];
    
    // Initial platform
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: PLATFORM_TYPES.NORMAL
    });
    
    // Random platforms
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

// Draw player from image
function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw platforms
function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(
            platformTextures[platform.type],
            platform.x, platform.y,
            platform.width, platform.height
        );
    });
}

// Check platform collision
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

// Update player position
function updatePlayer() {
    player.dy += player.gravity;
    player.y += player.dy;
    player.x += player.dx;
    
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

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updatePlayer();
    drawPlatforms();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    if (musicToggle.checked) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.dx = 0;
    player.dy = 0;
    
    generatePlatforms();
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    
    gameLoop();
}

// Game over
function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    if (score > highScore) highScore = score;
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || 
        e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 0;
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || !touchX) return;
    e.preventDefault();
    const newX = e.touches[0].clientX;
    player.dx = newX > touchX ? player.speed : -player.speed;
    touchX = newX;
});

canvas.addEventListener('touchend', () => {
    player.dx = 0;
    touchX = null;
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
