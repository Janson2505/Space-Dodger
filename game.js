// WYMAGANE: do katalogu z grą wrzuć pliki cosmos.mp3 (muzyka w tle) i preview.mp3 (dźwięk kolizji)
// Załaduj też plik rocket-draw.js z funkcją drawNiceRocket(ctx, cx, cy, scale)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const ROCKET_WIDTH = 40;
const ROCKET_HEIGHT = 60;
const ASTEROID_MIN_RADIUS = 20;
const ASTEROID_MAX_RADIUS = 45;
const ASTEROID_MIN_SPEED = 2;
const ASTEROID_MAX_SPEED = 5;
const ASTEROID_SPAWN_INTERVAL = 1200;
const STARS_COUNT = 60;

// Dźwięki: eksplozja i muzyka w tle
const sounds = {
    explosion: new Audio('preview.mp3'),
    bgm: new Audio('cosmos.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.25;      // Muzyka w tle głośność 25%
sounds.explosion.volume = 0.6; // Eksplozja głośność 60%

function playSound(sound) {
    if (sounds[sound]) {
        sounds[sound].pause();
        sounds[sound].currentTime = 0;
        sounds[sound].play();
    }
}

function playBackgroundMusic() {
    if (sounds.bgm.paused) {
        sounds.bgm.currentTime = 0;
        sounds.bgm.play();
    }
}

let rocket = {
    x: GAME_WIDTH / 2 - ROCKET_WIDTH / 2,
    y: GAME_HEIGHT - ROCKET_HEIGHT - 30,
    vx: 0,
    vy: 0,
    speed: 5,
    alive: true,
};
let asteroids = [];
let stars = [];
let keys = {};
let score = 0;
let bestScore = 0;
let startTime = 0;
let lastAsteroid = 0;
let gameOver = false;
let asteroidInterval = ASTEROID_SPAWN_INTERVAL;
let gameState = "start"; // start, running, gameover

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ((gameState === "start" || gameState === "gameover") && (e.code === "Space" || e.key === " ")) {
        playBackgroundMusic();
        startGame();
    }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function generateStars() {
    stars = [];
    for (let i = 0; i < STARS_COUNT; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            r: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fill();
    });
    ctx.restore();
}

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
        }
    });
}

function drawRocket() {
    // Ładna rakieta z rocket-draw.js:
    drawNiceRocket(ctx, rocket.x + ROCKET_WIDTH/2, rocket.y + ROCKET_HEIGHT/2, 1);
}

function drawAsteroid(asteroid) {
    ctx.save();
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#bbb";
    for (let i = 0; i < 7; i++) {
        let angle = Math.random() * 2 * Math.PI;
        let len = asteroid.radius * (1 + Math.random() * 0.3);
        ctx.beginPath();
        ctx.arc(asteroid.x + Math.cos(angle) * len, asteroid.y + Math.sin(angle) * len, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.restore();
}

function drawExplosion(cx, cy, r) {
    for (let i = 0; i < 13; i++) {
        let angle = Math.random() * 2 * Math.PI;
        let len = r + Math.random() * 25;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len, 6 + Math.random() * 8, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,${Math.floor(100+Math.random()*155)},0,${0.6+Math.random()*0.4})`;
        ctx.fill();
    }
}

function spawnAsteroid() {
    let radius = ASTEROID_MIN_RADIUS + Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS);
    let x = Math.random() * (GAME_WIDTH - 2 * radius) + radius;
    let y = -radius;
    let vx = Math.random() * 1.2 - 0.6;
    let vy = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    asteroids.push({x, y, vx, vy, radius});
}

function updateRocket() {
    if (!rocket.alive) return;
    if (keys['ArrowLeft'] || keys['a']) rocket.x -= rocket.speed;
    if (keys['ArrowRight'] || keys['d']) rocket.x += rocket.speed;
    if (keys['ArrowUp'] || keys['w']) rocket.y -= rocket.speed;
    if (keys['ArrowDown'] || keys['s']) rocket.y += rocket.speed;
    rocket.x = Math.max(0, Math.min(GAME_WIDTH - ROCKET_WIDTH, rocket.x));
    rocket.y = Math.max(0, Math.min(GAME_HEIGHT - ROCKET_HEIGHT, rocket.y));
}

function updateAsteroids() {
    for (let ast of asteroids) {
        ast.x += ast.vx;
        ast.y += ast.vy;
    }
    asteroids = asteroids.filter(ast =>
        ast.x + ast.radius > 0 &&
        ast.x - ast.radius < GAME_WIDTH &&
        ast.y - ast.radius < GAME_HEIGHT + 50
    );
}

function rocketHitsAsteroid(ast) {
    let cx = rocket.x + ROCKET_WIDTH / 2;
    let cy = rocket.y + ROCKET_HEIGHT / 2;
    let dist = Math.hypot(cx - ast.x, cy - ast.y);
    return dist < ast.radius + Math.min(ROCKET_WIDTH, ROCKET_HEIGHT) / 2.2;
}

function drawStartScreen() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    updateStars();
    drawStars();
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 42px monospace";
    ctx.fillStyle = "#2af";
    ctx.fillText("Rakieta przez", GAME_WIDTH/2, GAME_HEIGHT/2 - 60);
    ctx.fillText("asteroidę", GAME_WIDTH/2, GAME_HEIGHT/2 - 10);
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Sterowanie: Strzałki lub WASD", GAME_WIDTH/2, GAME_HEIGHT/2 + 30);
    ctx.font = "bold 26px monospace";
    ctx.fillStyle = "#ea1";
    ctx.fillText("Wciśnij SPACJĘ", GAME_WIDTH/2, GAME_HEIGHT/2 + 75);
    ctx.restore();
}

function drawGameOverScreen() {
    ctx.save();
    ctx.font = "bold 42px monospace";
    ctx.fillStyle = "#e21";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Wynik: " + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 25);
    ctx.fillText("Rekord: " + bestScore, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55);
    ctx.font = "bold 26px monospace";
    ctx.fillStyle = "#ea1";
    ctx.fillText("Wciśnij SPACJĘ", GAME_WIDTH/2, GAME_HEIGHT/2 + 95);
    ctx.restore();
    drawExplosion(rocket.x + ROCKET_WIDTH / 2, rocket.y + ROCKET_HEIGHT / 2, 70);
}

function gameLoop(ts) {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    updateStars();
    drawStars();

    if (gameState === "start") {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === "gameover") {
        drawRocket();
        for (let ast of asteroids) drawAsteroid(ast);
        drawGameOverScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    // gameState === "running"
    if (!gameOver && ts - lastAsteroid > asteroidInterval) {
        spawnAsteroid();
        lastAsteroid = ts;
        asteroidInterval = Math.max(400, ASTEROID_SPAWN_INTERVAL - Math.floor((score/10)));
    }

    updateRocket();
    drawRocket();

    updateAsteroids();
    for (let ast of asteroids) {
        drawAsteroid(ast);
        if (rocket.alive && rocketHitsAsteroid(ast)) {
            rocket.alive = false;
            gameOver = true;
            bestScore = Math.max(bestScore, score);
            playSound('explosion');
            gameState = "gameover";
        }
    }

    if (!gameOver) {
        score = Math.floor((performance.now() - startTime) / 10);
    }
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px monospace";
    ctx.fillText("Wynik: " + score, 10, 30);
    ctx.font = "14px monospace";
    ctx.fillText("Rekord: " + bestScore, 10, 50);
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

function restartGame() {
    rocket.x = GAME_WIDTH / 2 - ROCKET_WIDTH / 2;
    rocket.y = GAME_HEIGHT - ROCKET_HEIGHT - 30;
    rocket.alive = true;
    asteroids = [];
    score = 0;
    lastAsteroid = 0;
    asteroidInterval = ASTEROID_SPAWN_INTERVAL;
    startTime = performance.now();
    gameOver = false;
    generateStars();
}

function startGame() {
    restartGame();
    gameState = "running";
}

generateStars();
gameLoop();