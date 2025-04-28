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
const livesDisplay = document.getElementById('lives-display');

// Set canvas size
canvas.width = 360;
canvas.height = 640;

// Physics settings
const FPS = 60;
const FIXED_STEP = 1000 / FPS; // 16.67ms for 60fps
let lastTime = 0;
let accumulator = 0;

// Game state
let gameRunning = false;
let score = 0;
let highScore = 0;
let lives = 1;
let targetX = null;

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
    hasExtraLife: false,
    image: new Image()
};
player.image.src = 'assets/hero.png';

// Platform types
const PLATFORM_TYPES = {
    NORMAL: 0,
    BREAKABLE: 1,
    BOUNCY: 2 // New bouncy platform type
};

// Fruit
const fruit = {
    x: 0,
    y: 0,
    width: 30,
    height: 30,
    active: false,
    image: new Image()
};
fruit.image.src = 'assets/fruit.png';

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
    } 
    else if (type === PLATFORM_TYPES.BREAKABLE) {
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
    else if (type === PLATFORM_TYPES.BOUNCY) {
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(0, 0, 45, 15);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(22, 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(32, 10, 3, 0, Math.PI * 2);
        ctx.fill();
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
    [PLATFORM_TYPES.BREAKABLE]: createPlatformTexture(PLATFORM_TYPES.BREAKABLE),
    [PLATFORM_TYPES.BOUNCY]: createPlatformTexture(PLATFORM_TYPES.BOUNCY)
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
        let type;
        const rand = Math.random();
        
        if (rand > 0.9) {
            type = PLATFORM_TYPES.BOUNCY; // 10% chance for bouncy
        } else if (rand > 0.7) {
            type = PLATFORM_TYPES.BREAKABLE; // 20% chance for breakable
        } else {
            type = PLATFORM_TYPES.NORMAL; // 70% chance for normal
        }
        
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: y,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: type
        });
    }
    
    // Spawn fruit with 30% chance
    if (Math.random() > 0.7 && !fruit.active) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        fruit.x = platform.x + platform.width/2 - fruit.width/2;
        fruit.y = platform.y - fruit.height - 5;
        fruit.active = true;
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

function drawFruit() {
    if (fruit.active) {
        ctx.drawImage(fruit.image, fruit.x, fruit.y, fruit.width, fruit.height);
    }
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
            
            if (platform.type === PLATFORM_TYPES.BOUNCY) {
                player.dy = player.jumpForce * 5; // 5x higher jump
            } else {
                player.dy = player.jumpForce;
            }
            player.isJumping = false;
            
            if (platform.type === PLATFORM_TYPES.BREAKABLE) {
                setTimeout(() => {
                    platforms.splice(index, 1);
                    platforms.push({
                        x: Math.random() * (canvas.width - PLATFORM_WIDTH),
                        y: -50,
                        width: PLATFORM_WIDTH,
                        height: PLATFORM_HEIGHT,
                        type: Math.random() > 0.8 ? PLATFORM_TYPES.BREAKABLE : 
                              Math.random() > 0.6 ? PLATFORM_TYPES.BOUNCY : 
                              PLATFORM_TYPES.NORMAL
                    });
                }, 100);
            }
        }
    });
}

function checkFruitCollision() {
    if (!fruit.active) return;
    
    if (player.x + player.width > fruit.x &&
        player.x < fruit.x + fruit.width &&
        player.y + player.height > fruit.y &&
        player.y < fruit.y + fruit.height) {
        
        player.hasExtraLife = true;
        fruit.active = false;
        lives++;
        updateLivesDisplay();
    }
}

function updateLivesDisplay() {
    livesDisplay.textContent = `Lives: ${lives}`;
}

function updatePlayer(delta) {
    const deltaFactor = delta / FIXED_STEP; // Normalize for fixed timestep
    
    player.dy += player.gravity * deltaFactor;
    player.y += player.dy * deltaFactor;
    
    // Movement to target
    if (targetX !== null) {
        const targetCenter = targetX - player.width/2;
        const distance = targetCenter - player.x;
        player.x += distance * 0.1 * deltaFactor;
    }
    
    // Screen wrapping
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;
    
    // Check if player falls off the bottom
    if (player.y > canvas.height) {
        if (player.hasExtraLife) {
            // Save with extra life
            player.hasExtraLife = false;
            lives--;
            updateLivesDisplay();
            player.y = canvas.height / 3;
            player.dy = player.jumpForce;
            
            // Move platforms up to match
            const diff = player.y - (canvas.height - 100);
            platforms.forEach(platform => {
                platform.y -= diff;
            });
        } else {
            gameOver();
        }
    }
    
    // Camera follow
    if (player.y < canvas.height / 3) {
        const diff = canvas.height / 3 - player.y;
        player.y = canvas.height / 3;
        
        platforms.forEach(platform => {
            platform.y += diff;
            if (platform.y > canvas.height) {
                platform.y = -platform.height;
                platform.x = Math.random() * (canvas.width - platform.width);
                
                // Randomize platform type when regenerating
                const rand = Math.random();
                platform.type = rand > 0.9 ? PLATFORM_TYPES.BOUNCY : 
                               rand > 0.7 ? PLATFORM_TYPES.BREAKABLE : 
                               PLATFORM_TYPES.NORMAL;
                
                score += 10;
                scoreDisplay.textContent = `Score: ${score}`;
            }
        });
        
        // Move fruit if active
        if (fruit.active) {
            fruit.y += diff;
            if (fruit.y > canvas.height) {
                fruit.active = false;
            }
        }
    }
    
    checkPlatformCollision();
    checkFruitCollision();
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Prevent spiral of death
    if (deltaTime > 1000) deltaTime = FIXED_STEP;
    
    accumulator += deltaTime;
    
    while (accumulator >= FIXED_STEP) {
        updatePlayer(FIXED_STEP);
        accumulator -= FIXED_STEP;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPlatforms();
    drawFruit();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    if (musicToggle.checked) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    
    score = 0;
    lives = 1;
    player.hasExtraLife = false;
    scoreDisplay.textContent = `Score: ${score}`;
    updateLivesDisplay();
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;
    player.dy = 0;
    targetX = null;
    
    generatePlatforms();
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    lastTime = 0;
    accumulator = 0;
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    bgMusic.pause();
    finalScoreDisplay.textContent = `Score: ${score}`;
    gameOverScreen.style.display = 'flex';
    if (score > highScore) highScore = score;
}

// Controls (same as before)
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

// Mouse controls
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

// Keyboard controls
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
