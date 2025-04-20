// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Set canvas size
canvas.width = 360;
canvas.height = 640;

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

// Platform assets
const platformImages = {
    [PLATFORM_TYPES.NORMAL]: new Image(),
    [PLATFORM_TYPES.BREAKABLE]: new Image()
};
platformImages[PLATFORM_TYPES.NORMAL].src = 'assets/platform-green.png';
platformImages[PLATFORM_TYPES.BREAKABLE].src = 'assets/platform-red.png';

// Background
const bgImage = new Image();
bgImage.src = 'assets/background.png';

// Platforms
let platforms = [];
const PLATFORM_COUNT = 15; // Увеличили количество платформ
const PLATFORM_WIDTH = 45;  // Уменьшили ширину в 1.5 раза (было 70)
const PLATFORM_HEIGHT = 15;

// Generate platforms with better distribution
function generatePlatforms() {
    platforms = [];
    
    // Initial platform below player
    platforms.push({
        x: canvas.width / 2 - PLATFORM_WIDTH / 2,
        y: canvas.height - 50,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: PLATFORM_TYPES.NORMAL
    });
    
    // Generate other platforms with better vertical distribution
    const verticalStep = (canvas.height - 100) / (PLATFORM_COUNT - 1);
    
    for (let i = 0; i < PLATFORM_COUNT; i++) {
        // Распределяем платформы более равномерно по высоте
        const baseY = i * verticalStep;
        // Добавляем небольшой случайный разброс
        const y = Math.max(50, baseY + (Math.random() * 50 - 25));
        
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: Math.random() > 0.8 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL
        });
    }
}

// Draw background
function drawBackground() {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

// Draw player
function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw platforms
function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(
            platformImages[platform.type],
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
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        
        if (
            playerBottom <= platformBottom &&
            playerBottom >= platformTop &&
            player.dy > 0 &&
            playerCenter >= platformLeft &&
            playerCenter <= platformRight
        ) {
            player.dy = player.jumpForce;
            player.isJumping = false;
            
            // Break breakable platforms
            if (platform.type === PLATFORM_TYPES.BREAKABLE) {
                setTimeout(() => {
                    platforms.splice(index, 1);
                    // Add new platform at the top
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
    // Apply gravity
    player.dy += player.gravity;
    
    // Update position
    player.x += player.dx;
    player.y += player.dy;
    
    // Screen wrapping
    if (player.x + player.width < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = -player.width;
    }
    
    // Check if player falls off the bottom
    if (player.y > canvas.height) {
        gameOver();
    }
    
    // Camera follow (scroll platforms down when player reaches top 1/3)
    if (player.y < canvas.height / 3) {
        const diff = canvas.height / 3 - player.y;
        player.y = canvas.height / 3;
        
        // Move platforms down
        platforms.forEach(platform => {
            platform.y += diff;
            
            // Remove platforms that go off screen and add new ones at the top
            if (platform.y > canvas.height) {
                platform.y = -platform.height;
                platform.x = Math.random() * (canvas.width - platform.width);
                platform.type = Math.random() > 0.8 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL;
                
                // Increase score
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw
    drawBackground();
    updatePlayer();
    drawPlatforms();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
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
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    
    if (score > highScore) {
        highScore = score;
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    } else if ((e.key === 'ArrowUp' || e.key === 'w') && !player.isJumping) {
        player.dy = player.jumpForce;
        player.isJumping = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 0;
    }
});

// Modern touch controls
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    touchX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || !touchX) return;
    e.preventDefault();
    
    const newTouchX = e.touches[0].clientX;
    const deltaX = newTouchX - touchX;
    
    if (Math.abs(deltaX) > 5) { // Deadzone to prevent accidental movement
        player.dx = deltaX > 0 ? player.speed : -player.speed;
    }
    
    touchX = newTouchX;
});

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    player.dx = 0;
    touchX = null;
});

// Mouse controls for testing on desktop
canvas.addEventListener('mousedown', (e) => {
    if (!gameRunning) return;
    touchX = e.clientX;
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning || !touchX) return;
    
    const newTouchX = e.clientX;
    const deltaX = newTouchX - touchX;
    
    if (Math.abs(deltaX) > 5) {
        player.dx = deltaX > 0 ? player.speed : -player.speed;
    }
    
    touchX = newTouchX;
});

canvas.addEventListener('mouseup', (e) => {
    if (!gameRunning) return;
    player.dx = 0;
    touchX = null;
});

// Start and restart buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize
window.onload = () => {
    // Hide mobile controls on desktop
    if (window.innerWidth > 768) {
        document.getElementById('mobile-controls').style.display = 'none';
    }
    
    startScreen.style.display = 'flex';
};
