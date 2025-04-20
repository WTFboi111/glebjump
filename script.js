const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Настройка размеров холста для телефонного формата (9:16)
const aspectRatio = 9 / 16;
canvas.width = window.innerWidth;
canvas.height = canvas.width / aspectRatio;

// Персонаж
const hero = {
  x: canvas.width / 2,
  y: canvas.height - 150,
  width: 50,
  height: 50,
  dx: 0,
  dy: 0,
  gravity: 0.5,
  jumpStrength: -10,
  image: new Image(),
};

hero.image.src = './assets/hero.png';

// Блоки
const platforms = [];
const platformWidth = 80;
const platformHeight = 20;
const platformGap = 150;

// Генерация начальных блоков
function generatePlatforms() {
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * (canvas.width - platformWidth);
    const y = i * platformGap;
    const type = Math.random() > 0.7 ? 'breakable' : 'normal'; // 30% шанс ломающегося блока
    platforms.push({ x, y, type });
  }
}

generatePlatforms();

// Основной игровой цикл
function gameLoop() {
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
          y: platforms[platforms.length - 1].y - platformGap,
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
          y: platforms[0].y - platformGap,
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
    hero.dx = -5;
  } else if (e.key === 'ArrowRight' || e.key === 'd') {
    hero.dx = 5;
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
  hero.dx = (touchEndX - touchStartX) * 0.1;
});

canvas.addEventListener('touchend', () => {
  hero.dx = 0;
});

// Запуск игры
gameLoop();
