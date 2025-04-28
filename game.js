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
const FIXED_STEP = 1000 / FPS;
let lastTime = 0;
let accumulator = 0;

// Boost system
let lastScoreTime = 0;
let isBoostedJump = false;
const SCORE_TIMEOUT = 3000; // 3 seconds for boost

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
    NORMAL: 0,      // Green - normal
    BREAKABLE: 1,   // Red - breaks, weak jump
    BOUNCY: 2,      // Blue - high jump
    MOVING: 3       // Yellow - moves horizontally
};

// Platform settings - измененные значения
const PLATFORM_WIDTH = 35; // Было 70, теперь в 2 раза уже
const PLATFORM_HEIGHT = 20;
const MIN_VERTICAL_GAP = 40; // Было 60, уменьшено для более частого появления
const MAX_VERTICAL_GAP = 80;  // Было 120, уменьшено

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
    canvas.width = PLATFORM_WIDTH;
    canvas.height = PLATFORM_HEIGHT;
    const ctx = canvas.getContext('2d');
    
    if (type === PLATFORM_TYPES.NORMAL) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.fillStyle = '#388E3C';
        for (let i = 0; i < 4; i++) { // Уменьшено количество полосок для узкой платформы
            ctx.fillRect(i * 8, 15, 6, 5);
        }
    } 
    else if (type === PLATFORM_TYPES.BREAKABLE) {
        ctx.fillStyle = '#F44336';
        ctx.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 10);
        ctx.lineTo(15, 15);
        ctx.lineTo(25, 5);
        ctx.lineTo(35, 10);
        ctx.stroke();
    }
    else if (type === PLATFORM_TYPES.BOUNCY) {
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(PLATFORM_WIDTH/2, 10, 5, 0, Math.PI * 2); // Центрированный круг
        ctx.fill();
    }
    else if (type === PLATFORM_TYPES.MOVING) {
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(0, 0, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.fillStyle = '#FFC107';
        for (let x = 5; x <= 25; x += 10) { // Уменьшенные стрелки
            ctx.beginPath();
            ctx.moveTo(x, 10);
            ctx.lineTo(x + 5, 10);
            ctx.lineTo(x + 2.5, 5);
            ctx.lineTo(x + 5, 10);
            ctx.lineTo(x + 2.5, 15);
            ctx.fill();
        }
    }
    return canvas;
}

// Pre-render platform textures
const platformTextures = {
    [PLATFORM_TYPES.NORMAL]: createPlatformTexture(PLATFORM_TYPES.NORMAL),
    [PLATFORM_TYPES.BREAKABLE]: createPlatformTexture(PLATFORM_TYPES.BREAKABLE),
    [PLATFORM_TYPES.BOUNCY]: createPlatformTexture(PLATFORM_TYPES.BOUNCY),
    [PLATFORM_TYPES.MOVING]: createPlatformTexture(PLATFORM_TYPES.MOVING)
};

// Background
function drawBackground() {
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
    
    // Generate other platforms - теперь 30 вместо 19
    const PLATFORM_COUNT = 30;
    let currentY = canvas.height - 100;
    
    for (let i = 0; i < PLATFORM_COUNT; i++) {
        currentY -= MIN_VERTICAL_GAP + Math.random() * (MAX_VERTICAL_GAP - MIN_VERTICAL_GAP);
        
        let type;
        const rand = Math.random();
        
        if (rand > 0.95) {
            type = PLATFORM_TYPES.BOUNCY; // 5% - bouncy
        } 
        else if (rand > 0.85) {
            type = PLATFORM_TYPES.MOVING; // 10% - moving
        }
        else if (rand > 0.70) {
            type = PLATFORM_TYPES.BREAKABLE; // 15% - breakable
        }
        else {
            type = PLATFORM_TYPES.NORMAL; // 70% - normal
        }
        
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: currentY,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: type,
            direction: type === PLATFORM_TYPES.MOVING ? (Math.random() > 0.5 ? 1 : -1) : 0,
            speed: type === PLATFORM_TYPES.MOVING ? 1.2 : 0
        });
    }
    
    // Spawn fruit (not on breakable platforms)
    if (Math.random() > 0.7) {
        const stablePlatforms = platforms.filter(p => p.type !== PLATFORM_TYPES.BREAKABLE);
        if (stablePlatforms.length > 0) {
            const platform = stablePlatforms[Math.floor(Math.random() * stablePlatforms.length)];
            fruit.x = platform.x + platform.width/2 - fruit.width/2;
            fruit.y = platform.y - fruit.height - 5;
            fruit.active = true;
        }
    }
}

function updateMovingPlatforms(delta) {
    platforms.forEach(platform => {
        if (platform.type === PLATFORM_TYPES.MOVING) {
            platform.x += platform.direction * platform.speed * (delta / FIXED_STEP);
            
            if (platform.x <= 0) {
                platform.x = 0;
                platform.direction = 1;
            } 
            else if (platform.x + platform.width >= canvas.width) {
                platform.x = canvas.width - platform.width;
                platform.direction = -1;
            }
        }
    });
}

function scrollPlatforms(diff) {
    // Move all platforms down
    platforms.forEach(platform => {
        platform.y += diff;
    });
    
    // Remove platforms that went below the screen
    platforms = platforms.filter(platform => platform.y < canvas.height);
    
    // Add new platforms at the top if needed
    const topPlatformY = Math.min(...platforms.map(p => p.y));
    const platformsNeeded = 25 - platforms.length; // Было 15, теперь 25
    
    if (platformsNeeded > 0) {
        let currentY = topPlatformY;
        
        for (let i = 0; i < platformsNeeded; i++) {
            currentY -= MIN_VERTICAL_GAP + Math.random() * (MAX_VERTICAL_GAP - MIN_VERTICAL_GAP);
            
            let type;
            const rand = Math.random();
            
            if (rand > 0.95) type = PLATFORM_TYPES.BOUNCY;
            else if (rand > 0.85) type = PLATFORM_TYPES.MOVING;
            else if (rand > 0.70) type = PLATFORM_TYPES.BREAKABLE;
            else type = PLATFORM_TYPES.NORMAL;
            
            platforms.push({
                x: Math.random() * (canvas.width - PLATFORM_WIDTH),
                y: currentY,
                width: PLATFORM_WIDTH,
                height: PLATFORM_HEIGHT,
                type: type,
                direction: type === PLATFORM_TYPES.MOVING ? (Math.random() > 0.5 ? 1 : -1) : 0,
                speed: type === PLATFORM_TYPES.MOVING ? 1.2 : 0
            });
        }
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

function showBoostEffect() {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setTimeout(() => {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);
}

function checkPlatformCollision() {
    const playerBottom = player.y + player.height;
    const playerCenter = player.x + player.width / 2;
    
    // Check time without scoring
    const timeWithoutScore = Date.now() - lastScoreTime;
    const shouldBoost = timeWithoutScore > SCORE_TIMEOUT && !isBoostedJump;
    
    platforms.forEach((platform, index) => {
        if (playerBottom <= platform.y + platform.height &&
            playerBottom >= platform.y &&
            player.dy > 0 &&
            playerCenter >= platform.x &&
            playerCenter <= platform.x + platform.width) {
            
            let jumpForce = player.jumpForce;
            
            // Apply platform modifiers
            if (platform.type === PLATFORM_TYPES.BOUNCY) {
                jumpForce *= 1.8;
            } 
            else if (platform.type === PLATFORM_TYPES.BREAKABLE) {
                jumpForce *= 0.7;
                setTimeout(() => {
                    const index = platforms.indexOf(platform);
                    if (index > -1) platforms.splice(index, 1);
                }, 100);
            }
            
            // Apply boost if needed
            if (shouldBoost) {
                jumpForce *= 1.5;
                isBoostedJump = true;
                showBoostEffect();
            }
            
            player.dy = jumpForce;
            player.isJumping = false;
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
    const deltaFactor = delta / FIXED_STEP;
    
    // Apply gravity
    player.dy += player.gravity * deltaFactor;
    player.y += player.dy * deltaFactor;
    
    // Move to touch position
    if (targetX !== null) {
        const targetCenter = targetX - player.width/2;
        const distance = targetCenter - player.x;
        player.x += distance * 0.1 * deltaFactor;
    }
    
    // Screen wrapping
    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;
    
    // Check if player falls
    if (player.y > canvas.height) {
        if (player.hasExtraLife) {
            // Save with extra life
            player.hasExtraLife = false;
            lives--;
            updateLivesDisplay();
            
            // Respawn with bounce effect
            player.y = canvas.height - 100;
            player.dy = player.jumpForce * 1.8;
            
            // Generate safe platforms below
            generateRescuePlatforms();
            
            // Visual effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            gameOver();
        }
    }
    
    // Camera follow
    if (player.y < canvas.height / 3) {
        const diff = canvas.height / 3 - player.y;
        player.y = canvas.height / 3;
        
        scrollPlatforms(diff);
        
        // Move fruit if active
        if (fruit.active) {
            fruit.y += diff;
            if (fruit.y > canvas.height) {
                fruit.active = false;
            }
        }
        
        score += 1;
        scoreDisplay.textContent = `Score: ${score}`;
        lastScoreTime = Date.now();
        isBoostedJump = false;
    }
    
    checkPlatformCollision();
    checkFruitCollision();
}

function generateRescuePlatforms() {
    // Remove platforms below player
    platforms = platforms.filter(p => p.y < player.y);
    
    // Add new safe platforms
    const count = 8;
    let currentY = player.y + 60;
    
    for (let i = 0; i < count; i++) {
        currentY += 60 + Math.random() * 40;
        
        platforms.push({
            x: Math.random() * (canvas.width - PLATFORM_WIDTH),
            y: currentY,
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: i === 4 ? PLATFORM_TYPES.BOUNCY : PLATFORM_TYPES.NORMAL
        });
    }
    
    // 50% chance for fruit
    if (Math.random() > 0.5) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        fruit.x = platform.x + platform.width/2 - fruit.width/2;
        fruit.y = platform.y - fruit.height - 5;
        fruit.active = true;
    }
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
        updateMovingPlatforms(FIXED_STEP);
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
    lastScoreTime = Date.now();
    isBoostedJump = false;
    
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

// Touch controls
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
