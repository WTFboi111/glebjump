const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Настройка размеров холста для телефонного формата (9:16)
const aspectRatio = 9 / 16;
canvas.width = window.innerWidth * 0.5625; // 56.25% ширины экрана
canvas.height = canvas.width / aspectRatio;

// Переменные игры
let isGameStarted = false;
let platforms = [];

// Размеры зависят от размеров экрана
const platformWidth = canvas.width * 0.05; // В 3 раза уже (5% ширины экрана)
const platformHeight = canvas.height * 0.01; // 1% высоты экрана
const screenDivisions = 25; // Экран разделен на 25 невидимых высот
const minPlatformGap = canvas.height / screenDivisions; // Минимальное расстояние между платформами

// Персонаж
const hero = {
  x: canvas.width / 2,
  y: canvas.height - canvas.height * 0.2, // 20% от нижней части экрана
  width: canvas.width * 0.1, // 10% ширины экрана
  height: canvas.width * 0.1, // 10% ширины экрана
  dx: 0,
  dy: 0,
  gravity: canvas.height * 0.001, // Гравитация зависит от высоты экрана
  jumpStrength: -canvas.height * 0.027, // Прыжок зависит от высоты экрана
  image: new Image(),
};

hero.image.src = './assets/hero.png';

// Генерация платформ
function generatePlatforms() {
  platforms = [];
  for (let i = 0; i < screenDivisions; i++) {
    const numPlatformsOnRow = Math.floor(Math.random() * 4) + 2; // 1-4 платформы на одной высоте
    for (let j = 0; j < numPlatformsOnRow; j++) {
      const x = Math.random() * (canvas.width - platformWidth);
      const y = i * (minPlatformGap + Math.random() * minPlatformGap * 0.5); // Разные высоты
      const type = Math.random() > 0.7 ? 'breakable' : 'normal'; // 30% шанс ломающегося блока
      platforms.push({ x, y, type });
    }
  }

  // Добавляем полный первый ряд платформ
  for (let x = 0; x < canvas.width; x += platformWidth * 4) {
    platforms.push({ x, y: canvas.height - platformHeight, type: 'normal' });
  }
}

// Основной игровой цикл
function gameLoop() {
  if (!isGameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем персонажа
  ctx.drawImage(hero.image, hero.x, hero.y, hero.width, hero.height);

  // Применяем гравитацию
  hero.dy += hero.gravity;
  hero.y += hero.dy;

  // Управление горизонтальным движением
  hero.x += hero.dx;

  // Телепортация за края экрана
  if (hero.x + hero.width < 0) {
    hero.x = canvas.width;
  } else if (hero.x > canvas.width) {
    hero.x = -hero.width;
  }

  // Проверка столкновений с платформами
  platforms.forEach((platform, index) => {
    if (
      hero.y + hero.height <= platform.y &&
      hero.y + hero.height + hero.dy >= platform.y &&
      hero.x + hero.width > platform.x &&
      hero.x < platform.x + platformWidth
    ) {
      hero.dy = hero.jumpStrength;

      // Ломаем блок, если он breakable
      if (platform.type === 'breakable') {
        platforms.splice(index, 1);
        platforms.push({
          x: Math.random() * (canvas.width - platformWidth),
          y: platforms[platforms.length - 1].y - (minPlatformGap + Math.random() * minPlatformGap * 0.5),
          type: Math.random() > 0.7 ? 'breakable' : 'normal',
        });
      }
    }
  });

  // Перемещение платформ вниз
  if (hero.y < canvas.height / 3) {
    platforms.forEach((platform) => {
      platform.y += Math.abs(hero.dy);
    });

    // Удаляем платформы, которые вышли за пределы экрана
    platforms.forEach((platform, index) => {
      if (platform.y > canvas.height) {
        platforms.splice(index, 1);
        platforms.push({
          x: Math.random() * (canvas.width - platformWidth),
          y: platforms[0].y - (minPlatformGap + Math.random() * minPlatformGap * 0.5),
          type: Math.random() > 0.7 ? 'breakable' : 'normal',
        });
      }
    });
  }

  // Рисуем платформы
  platforms.forEach((platform) => {
    ctx.fillStyle = platform.type === 'breakable' ? 'red' : 'green';
    ctx.fillRect(platform.x, platform.y, platformWidth, platformHeight);
  });

  requestAnimationFrame(gameLoop);
}

// Управление
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    hero.dx = -canvas.width * 0.01; // Скорость движения зависит от ширины экрана
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    hero.dx = canvas.width * 0.01; // Скорость движения зависит от ширины экрана
  }
});

document.addEventListener('keyup', () => {
  hero.dx = 0;
});

// Сенсорное управление
let touchStartX = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
  const touchEndX = e.touches[0].clientX;
  hero.dx = (touchEndX - touchStartX) * 0.01; // Скорость зависит от разницы координат
});

canvas.addEventListener('touchend', () => {
  hero.dx = 0;
});

// Кнопка "Старт"
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameContainer = document.getElementById('game-container');

startButton.addEventListener('click', () => {
  isGameStarted = true;
  startScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  generatePlatforms();
  gameLoop();
});
