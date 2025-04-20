// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// Set canvas size
canvas.width = 360;
canvas.height = 640;

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
    speed: 5,
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

// Platforms
let platforms = [];
const PLATFORM_COUNT = 8;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 20;

// Generate platforms
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
    
    // Generate other platforms
    for (let i = 0; i < PLATFORM_COUNT; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: Math.random() * (canvas.height - 100),
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: Math.random() > 0.7 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL
        });
    }
}

// Draw player
function drawPlayer() {
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

// Draw platforms
function drawPlatforms() {
    platforms.forEach(platform => {
        if (platform.type === PLATFORM_TYPES.NORMAL) {
            ctx.fillStyle = '#4CAF50';
        } else {
            ctx.fillStyle = '#F44336';
        }
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
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
                        type: Math.random() > 0.7 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL
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
    
    // Camera follow (scroll platforms down when player reaches top half)
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        
        // Move platforms down
        platforms.forEach(platform => {
            platform.y += diff;
            
            // Remove platforms that go off screen and add new ones at the top
            if (platform.y > canvas.height) {
                platform.y = -platform.height;
                platform.x = Math.random() * (canvas.width - platform.width);
                platform.type = Math.random() > 0.7 ? PLATFORM_TYPES.BREAKABLE : PLATFORM_TYPES.NORMAL;
                
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

// Event listeners for keyboard controls
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

// Touch controls for mobile
let leftPressed = false;
let rightPressed = false;

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    leftPressed = true;
    player.dx = -player.speed;
});

leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    leftPressed = false;
    if (!rightPressed) player.dx = 0;
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    rightPressed = true;
    player.dx = player.speed;
});

rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    rightPressed = false;
    if (!leftPressed) player.dx = 0;
});

// Start and restart buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initialize
player.image.onload = () => {
    startScreen.style.display = 'flex';
};
