// --- POZIOMY TRUDNOŚCI: łatwy, średni, trudny ---
// Do katalogu z grą wrzuć pliki cosmos.mp3, preview.mp3 oraz rocket-draw.js

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const ROCKET_WIDTH = 40;
const ROCKET_HEIGHT = 60;
const STARS_COUNT = 60;

// Poziomy trudności - parametry
const DIFFICULTY_SETTINGS = {
    "łatwy": {
        ASTEROID_MIN_SPEED: 2,
        ASTEROID_MAX_SPEED: 3.2,
        ASTEROID_SPAWN_INTERVAL: 1400,
        ASTEROID_MIN_RADIUS: 26,
        ASTEROID_MAX_RADIUS: 50,
        DEBRIS_CHANCE: 0.002,
        SATELLITE_CHANCE: 0.0005,
        COMET_CHANCE: 0.0004
    },
    "średni": {
        ASTEROID_MIN_SPEED: 2.5,
        ASTEROID_MAX_SPEED: 4,
        ASTEROID_SPAWN_INTERVAL: 1050,
        ASTEROID_MIN_RADIUS: 22,
        ASTEROID_MAX_RADIUS: 45,
        DEBRIS_CHANCE: 0.004,
        SATELLITE_CHANCE: 0.001,
        COMET_CHANCE: 0.0008
    },
    "trudny": {
        ASTEROID_MIN_SPEED: 3.5,
        ASTEROID_MAX_SPEED: 5.3,
        ASTEROID_SPAWN_INTERVAL: 800,
        ASTEROID_MIN_RADIUS: 16,
        ASTEROID_MAX_RADIUS: 38,
        DEBRIS_CHANCE: 0.006,
        SATELLITE_CHANCE: 0.0016,
        COMET_CHANCE: 0.0013
    }
};

let selectedDifficulty = "średni";
let showDifficultyMenu = true;

let ASTEROID_MIN_RADIUS = DIFFICULTY_SETTINGS[selectedDifficulty].ASTEROID_MIN_RADIUS;
let ASTEROID_MAX_RADIUS = DIFFICULTY_SETTINGS[selectedDifficulty].ASTEROID_MAX_RADIUS;
let ASTEROID_MIN_SPEED = DIFFICULTY_SETTINGS[selectedDifficulty].ASTEROID_MIN_SPEED;
let ASTEROID_MAX_SPEED = DIFFICULTY_SETTINGS[selectedDifficulty].ASTEROID_MAX_SPEED;
let ASTEROID_SPAWN_INTERVAL = DIFFICULTY_SETTINGS[selectedDifficulty].ASTEROID_SPAWN_INTERVAL;
let DEBRIS_CHANCE = DIFFICULTY_SETTINGS[selectedDifficulty].DEBRIS_CHANCE;
let SATELLITE_CHANCE = DIFFICULTY_SETTINGS[selectedDifficulty].SATELLITE_CHANCE;
let COMET_CHANCE = DIFFICULTY_SETTINGS[selectedDifficulty].COMET_CHANCE;

// Dźwięki: eksplozja i muzyka w tle
const sounds = {
    explosion: new Audio('preview.mp3'),
    bgm: new Audio('cosmos.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.25;
sounds.explosion.volume = 0.6;

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

// --- Stan gry ---
let rocket = {
    x: GAME_WIDTH / 2 - ROCKET_WIDTH / 2,
    y: GAME_HEIGHT - ROCKET_HEIGHT - 30,
    vx: 0,
    vy: 0,
    speed: 5,
    alive: true,
};
let asteroids = [];
let debris = [];
let comets = [];
let stars = [];
let keys = {};
let score = 0;
let bestScore = 0;
let startTime = 0;
let lastAsteroid = 0;
let gameOver = false;
let asteroidInterval = ASTEROID_SPAWN_INTERVAL;
let gameState = "start"; // start, running, gameover

// --- Bonus: TARCZA ---
let shield = {
    active: false,
    x: 0,
    y: 0,
    radius: 22,
    show: false,
    appearTime: 0,
    duration: 4000, // ms
    collectedAt: 0
};
let shieldEffectEnd = 0;
let shieldFlash = false;

// --- Obsługa klawiatury ---
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Wybór poziomu trudności w menu startowym
    if (gameState === "start" && showDifficultyMenu) {
        if (e.key === "ArrowLeft" || e.key === "a") {
            if (selectedDifficulty === "trudny") selectedDifficulty = "średni";
            else if (selectedDifficulty === "średni") selectedDifficulty = "łatwy";
        }
        if (e.key === "ArrowRight" || e.key === "d") {
            if (selectedDifficulty === "łatwy") selectedDifficulty = "średni";
            else if (selectedDifficulty === "średni") selectedDifficulty = "trudny";
        }
    }
    // Start gry po wyborze poziomu
    if ((gameState === "start" || gameState === "gameover") && (e.code === "Space" || e.key === " ")) {
        if (showDifficultyMenu) {
            // Przypisz parametry wybranego poziomu
            let set = DIFFICULTY_SETTINGS[selectedDifficulty];
            ASTEROID_MIN_RADIUS = set.ASTEROID_MIN_RADIUS;
            ASTEROID_MAX_RADIUS = set.ASTEROID_MAX_RADIUS;
            ASTEROID_MIN_SPEED = set.ASTEROID_MIN_SPEED;
            ASTEROID_MAX_SPEED = set.ASTEROID_MAX_SPEED;
            ASTEROID_SPAWN_INTERVAL = set.ASTEROID_SPAWN_INTERVAL;
            DEBRIS_CHANCE = set.DEBRIS_CHANCE;
            SATELLITE_CHANCE = set.SATELLITE_CHANCE;
            COMET_CHANCE = set.COMET_CHANCE;
            showDifficultyMenu = false;
        }
        playBackgroundMusic();
        startGame();
    }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- Gwiazdy ---
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

// --- Rakieta ---
function drawRocket() {
    drawNiceRocket(ctx, rocket.x + ROCKET_WIDTH/2, rocket.y + ROCKET_HEIGHT/2, 1);
}

// --- ASTEROIDY I PRZESZKODY ---
// Typy: 'normal', 'spin', 'split', 'mini'
function drawAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    if (asteroid.type === "spin") {
        ctx.rotate(asteroid.angle || 0);
    }
    ctx.fillStyle = asteroid.type === "mini" ? "#ccc" : "#888";
    ctx.beginPath();
    ctx.arc(0, 0, asteroid.radius, 0, 2 * Math.PI);
    ctx.fill();
    if (asteroid.type === "split") {
        ctx.strokeStyle = "#f47";
        ctx.lineWidth = 2;
    } else if (asteroid.type === "spin") {
        ctx.strokeStyle = "#7df";
        ctx.lineWidth = 2;
    } else {
        ctx.strokeStyle = "#bbb";
        ctx.lineWidth = 1;
    }
    for (let i = 0; i < 7; i++) {
        let angle = Math.random() * 2 * Math.PI;
        let len = asteroid.radius * (1 + Math.random() * 0.3);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * len, Math.sin(angle) * len, 3, 0, 2 * Math.PI);
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
    // Random typ
    let typelottery = Math.random();
    let type = "normal";
    if (typelottery < 0.13) type = "spin";
    else if (typelottery < 0.22) type = "split";
    else if (typelottery < 0.32) type = "mini";

    let radius = ASTEROID_MIN_RADIUS + Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS);
    if (type === "mini") radius = Math.random() * 13 + 9;

    let x = Math.random() * (GAME_WIDTH - 2 * radius) + radius;
    let y = -radius;
    let vx = Math.random() * 1.2 - 0.6;
    let vy = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    if (type === "mini") vy += 1.2;
    let asteroid = {x, y, vx, vy, radius, type};
    if (type === "spin") asteroid.angle = 0;
    if (type === "split") asteroid.hasSplit = false;
    asteroids.push(asteroid);
}

// --- Kosmiczne śmieci (trybik) ---
function spawnDebris() {
    if (Math.random() < DEBRIS_CHANCE) {
        let x = Math.random() * (GAME_WIDTH - 30) + 15;
        let y = -12;
        let vy = 2.0 + (selectedDifficulty === "łatwy" ? 0 : (selectedDifficulty === "trudny" ? 2 : 1)) + Math.random() * 2;
        debris.push({x, y, vy, rot: Math.random()*Math.PI*2, vrot: (Math.random()-0.5)*0.13});
    }
}
function drawDebris(d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    // Trybik (zębate koło)
    ctx.beginPath();
    for(let i=0;i<8;i++) {
        let ang = i * Math.PI/4;
        let r1 = 8, r2 = 11;
        ctx.lineTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
        ctx.lineTo(Math.cos(ang+Math.PI/8)*r1, Math.sin(ang+Math.PI/8)*r1);
    }
    ctx.closePath();
    ctx.fillStyle = "#97f";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Środek
    ctx.beginPath();
    ctx.arc(0,0,4,0,2*Math.PI);
    ctx.fillStyle="#fff";
    ctx.fill();
    ctx.restore();
}

// --- Satelity ---
function spawnSatellite() {
    if (Math.random() < SATELLITE_CHANCE) {
        let x = Math.random() * (GAME_WIDTH - 50) + 25;
        let y = -18;
        let vy = 1.2 + (selectedDifficulty === "łatwy" ? 0 : (selectedDifficulty === "trudny" ? 1.4 : 0.7)) + Math.random();
        comets.push({x, y, vy, t: "sat"});
    }
}
function drawSatellite(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.sin(s.y/19)*0.2);
    // Panele słoneczne
    ctx.fillStyle = "#3af";
    ctx.fillRect(-18, -4, 8, 16);
    ctx.fillRect(10, -4, 8, 16);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(-18, -4, 8, 16);
    ctx.strokeRect(10, -4, 8, 16);
    // Korpus
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 7, 0, 0, 2*Math.PI);
    ctx.fillStyle = "#bbb";
    ctx.fill();
    ctx.strokeStyle="#aaa";
    ctx.stroke();
    // Antena
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, 23);
    ctx.strokeStyle="#ff2";
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0,23,2,0,2*Math.PI);
    ctx.fillStyle="#ff2";
    ctx.fill();
    ctx.restore();
}

// --- Komety ---
function spawnComet() {
    if (Math.random() < COMET_CHANCE) {
        let x = Math.random() * (GAME_WIDTH - 32) + 16;
        let y = -16;
        let vy = 4.5 + (selectedDifficulty === "łatwy" ? 0 : (selectedDifficulty === "trudny" ? 3.5 : 2)) + Math.random() * 2;
        comets.push({x, y, vy, t: "comet"});
    }
}
function drawComet(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    // Ogon
    let len = 36;
    for(let i=0;i<3;i++) {
        ctx.beginPath();
        ctx.moveTo(0,0);
        let angle = Math.PI + (i-1)*0.15 + Math.sin(c.y/30)*0.1;
        ctx.lineTo(Math.cos(angle)*len, Math.sin(angle)*len);
        ctx.strokeStyle = `rgba(80,240,255,${0.15+0.08*i})`;
        ctx.lineWidth = 3-i;
        ctx.stroke();
    }
    // Jądro komety
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#0ef";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#0ef";
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.restore();
}

// --- Bonus: TARCZA ---
function maybeSpawnShield(ts) {
    if (!shield.show && !shield.active && Math.random() < 0.003) {
        shield.x = Math.random() * (GAME_WIDTH - 40) + 20;
        shield.y = Math.random() * (GAME_HEIGHT / 2) + 60;
        shield.show = true;
        shield.appearTime = ts;
    }
}
function drawShieldBonus() {
    if (!shield.show) return;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(shield.x, shield.y, shield.radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#0af';
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.fillText("S", shield.x, shield.y + 7);
    ctx.restore();
}
function drawShieldAroundRocket() {
    if (!shield.active) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rocket.x + ROCKET_WIDTH/2, rocket.y + ROCKET_HEIGHT/2, ROCKET_WIDTH/1.3, 0, 2 * Math.PI);
    ctx.strokeStyle = shieldFlash ? "#ff0" : "#0ff";
    ctx.lineWidth = shieldFlash ? 7 : 5;
    ctx.globalAlpha = 0.6 + 0.3*Math.random();
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();
}
function rocketGetsShield() {
    let cx = rocket.x + ROCKET_WIDTH / 2;
    let cy = rocket.y + ROCKET_HEIGHT / 2;
    let dist = Math.hypot(cx - shield.x, cy - shield.y);
    return dist < shield.radius + Math.min(ROCKET_WIDTH, ROCKET_HEIGHT) / 2.1;
}

function rocketHitsAsteroid(ast) {
    let cx = rocket.x + ROCKET_WIDTH / 2;
    let cy = rocket.y + ROCKET_HEIGHT / 2;
    let dist = Math.hypot(cx - ast.x, cy - ast.y);
    return dist < ast.radius + Math.min(ROCKET_WIDTH, ROCKET_HEIGHT) / 2.2;
}

function rocketHitsDebris(d) {
    let cx = rocket.x + ROCKET_WIDTH / 2;
    let cy = rocket.y + ROCKET_HEIGHT / 2;
    return (
        Math.hypot(cx - d.x, cy - d.y) < 13
    );
}
function rocketHitsComet(c) {
    let cx = rocket.x + ROCKET_WIDTH / 2;
    let cy = rocket.y + ROCKET_HEIGHT / 2;
    if (c.t === "comet") return Math.hypot(cx - c.x, cy - c.y) < 18 + Math.min(ROCKET_WIDTH, ROCKET_HEIGHT)/2.5;
    if (c.t === "sat") return (
        cx > c.x - 18 &&
        cx < c.x + 18 &&
        cy > c.y - 9 &&
        cy < c.y + 23
    );
    return false;
}

// --- Menu trudności ---
function drawDifficultyMenu() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 23px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Wybierz poziom trudności:", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55);

    const difficulties = ["łatwy", "średni", "trudny"];
    const baseY = GAME_HEIGHT / 2 + 95;
    difficulties.forEach((diff, i) => {
        ctx.font = selectedDifficulty === diff ? "bold 32px monospace" : "26px monospace";
        ctx.fillStyle = selectedDifficulty === diff ? "#ea1" : "#888";
        ctx.fillText(
            diff.charAt(0).toUpperCase() + diff.slice(1),
            GAME_WIDTH / 2 + (i - 1) * 120,
            baseY
        );
    });

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Lewo/Prawo aby zmienić, Spacja by zacząć", GAME_WIDTH/2, baseY + 35);
    ctx.restore();
}

// --- Ekrany gry ---
function drawStartScreen() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    updateStars();
    drawStars();
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 42px monospace";
    ctx.fillStyle = "#2af";
    ctx.fillText("Rakieta przez", GAME_WIDTH/2, GAME_HEIGHT/2 - 80);
    ctx.fillText("asteroidę", GAME_WIDTH/2, GAME_HEIGHT/2 - 30);

    ctx.font = "20px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText("Sterowanie: Strzałki lub WASD", GAME_WIDTH/2, GAME_HEIGHT/2 + 15);

    ctx.restore();
    if (showDifficultyMenu) {
        drawDifficultyMenu();
    } else {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 26px monospace";
        ctx.fillStyle = "#ea1";
        ctx.fillText("Wciśnij SPACJĘ", GAME_WIDTH/2, GAME_HEIGHT/2 + 60);
        ctx.restore();
    }
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

// --- Pętla gry ---
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
        debris.forEach(drawDebris);
        comets.forEach(c => {
            if (c.t === "comet") drawComet(c);
            else if (c.t === "sat") drawSatellite(c);
        });
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
    spawnDebris();
    spawnSatellite();
    spawnComet();

    updateRocket();
    drawRocket();

    // --- ASTEROIDY
    asteroids.forEach(ast => {
        if (ast.type === "spin") ast.angle += 0.12;
    });
    for (let ast of asteroids) {
        ast.x += ast.vx;
        ast.y += ast.vy;
    }
    asteroids = asteroids.filter(ast =>
        ast.x + ast.radius > 0 &&
        ast.x - ast.radius < GAME_WIDTH &&
        ast.y - ast.radius < GAME_HEIGHT + 50
    );
    for (let i = 0; i < asteroids.length; i++) {
        let ast = asteroids[i];
        drawAsteroid(ast);
        if (rocket.alive && rocketHitsAsteroid(ast)) {
            if (shield.active) {
                ast.vy = -Math.abs(ast.vy) * 0.3;
                ast.y -= 30;
                shieldFlash = true;
            } else if (ast.type === "split" && !ast.hasSplit && ast.radius > 11) {
                ast.hasSplit = true;
                for (let j = 0; j < 2; j++) {
                    let na = {
                        x: ast.x + (j === 0 ? -10 : 10),
                        y: ast.y - 12,
                        vx: (Math.random()-0.5)*2,
                        vy: ast.vy * 1.25,
                        radius: ast.radius * 0.6,
                        type: "mini"
                    };
                    asteroids.push(na);
                }
                asteroids.splice(i, 1); i--;
                playSound('explosion');
                continue;
            } else {
                rocket.alive = false;
                gameOver = true;
                bestScore = Math.max(bestScore, score);
                playSound('explosion');
                gameState = "gameover";
            }
        }
    }

    // --- DEBRIS (kosmiczne śmieci)
    debris.forEach((d, i) => {
        d.y += d.vy;
        d.rot += d.vrot;
        drawDebris(d);
        if (rocket.alive && rocketHitsDebris(d)) {
            if (shield.active) {
                debris.splice(i, 1); i--;
                shieldFlash = true;
            } else {
                rocket.alive = false;
                gameOver = true;
                bestScore = Math.max(bestScore, score);
                playSound('explosion');
                gameState = "gameover";
            }
        }
    });
    debris = debris.filter(d => d.y < GAME_HEIGHT + 18);

    // --- KOMETY & SATELITY
    comets.forEach((c, i) => {
        c.y += c.vy;
        if (c.t === "comet") drawComet(c);
        else if (c.t === "sat") drawSatellite(c);
        if (rocket.alive && rocketHitsComet(c)) {
            if (shield.active) {
                comets.splice(i, 1); i--;
                shieldFlash = true;
            } else {
                rocket.alive = false;
                gameOver = true;
                bestScore = Math.max(bestScore, score);
                playSound('explosion');
                gameState = "gameover";
            }
        }
    });
    comets = comets.filter(c => c.y < GAME_HEIGHT + 30);

    // --- Bonus: Tarcza ---
    maybeSpawnShield(ts);

    if (shield.show) {
        drawShieldBonus();
        if (ts - shield.appearTime > 7000) shield.show = false;
        if (rocketGetsShield()) {
            shield.active = true;
            shield.collectedAt = ts;
            shield.show = false;
            shieldEffectEnd = ts + shield.duration;
        }
    }
    if (shield.active && ts > shieldEffectEnd) {
        shield.active = false;
    }
    drawShieldAroundRocket();
    shieldFlash = false;

    if (!gameOver) {
        score = Math.floor((performance.now() - startTime) / 10);
    }
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px monospace";
    ctx.fillText("Wynik: " + score, 10, 30);
    ctx.font = "14px monospace";
    ctx.fillText("Rekord: " + bestScore, 10, 50);
    if (shield.active) {
        ctx.font = "bold 17px monospace";
        ctx.fillStyle = "#0ff";
        ctx.fillText("Tarcza!", GAME_WIDTH-80, 30);
    }
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// --- Obsługa rakiety i restart gry ---
function updateRocket() {
    if (!rocket.alive) return;
    if (keys['ArrowLeft'] || keys['a']) rocket.x -= rocket.speed;
    if (keys['ArrowRight'] || keys['d']) rocket.x += rocket.speed;
    if (keys['ArrowUp'] || keys['w']) rocket.y -= rocket.speed;
    if (keys['ArrowDown'] || keys['s']) rocket.y += rocket.speed;
    rocket.x = Math.max(0, Math.min(GAME_WIDTH - ROCKET_WIDTH, rocket.x));
    rocket.y = Math.max(0, Math.min(GAME_HEIGHT - ROCKET_HEIGHT, rocket.y));
}

function restartGame() {
    rocket.x = GAME_WIDTH / 2 - ROCKET_WIDTH / 2;
    rocket.y = GAME_HEIGHT - ROCKET_HEIGHT - 30;
    rocket.alive = true;
    asteroids = [];
    debris = [];
    comets = [];
    score = 0;
    lastAsteroid = 0;
    asteroidInterval = ASTEROID_SPAWN_INTERVAL;
    startTime = performance.now();
    gameOver = false;
    generateStars();
    shield.active = false;
    shield.show = false;
    shieldEffectEnd = 0;
    if (gameState === "gameover") showDifficultyMenu = true;
}

function startGame() {
    restartGame();
    gameState = "running";
}

// --- Start gry ---
generateStars();
gameLoop();