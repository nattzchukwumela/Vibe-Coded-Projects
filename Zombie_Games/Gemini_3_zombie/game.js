const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const healthFillEl = document.getElementById('health-fill');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game State
let gameRunning = false;
let score = 0;
let animationId;
let lastTime = 0;

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Input Handling
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    if (gameRunning) {
        player.shoot();
    }
});

// Classes
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = '#3498db';
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Gun barrel
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -5, 30, 10);
        ctx.restore();
    }

    update() {
        if (keys.w && this.y - this.radius > 0) this.y -= this.speed;
        if (keys.s && this.y + this.radius < canvas.height) this.y += this.speed;
        if (keys.a && this.x - this.radius > 0) this.x -= this.speed;
        if (keys.d && this.x + this.radius < canvas.width) this.x += this.speed;
    }

    shoot() {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        const velocity = {
            x: Math.cos(angle) * 10,
            y: Math.sin(angle) * 10
        };
        projectiles.push(new Projectile(this.x, this.y, 5, '#f1c40f', velocity));
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.updateHealthUI();
        if (this.health <= 0) {
            endGame();
        }
    }

    updateHealthUI() {
        const percent = (this.health / this.maxHealth) * 100;
        healthFillEl.style.width = `${percent}%`;
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Zombie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.color = '#2ecc71';
        this.speed = 1 + Math.random(); // Random speed
        this.velocity = { x: 0, y: 0 };
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.y = Math.sin(angle) * this.speed;

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

// Game Objects
let player;
let projectiles = [];
let zombies = [];
let particles = [];

// Spawning
let spawnInterval;

function spawnZombies() {
    spawnInterval = setInterval(() => {
        const radius = 20;
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        zombies.push(new Zombie(x, y));
    }, 1000); // Spawn every second
}

// Game Loop
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.draw();
    player.update();

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();

        // Remove off-screen projectiles
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    zombies.forEach((zombie, index) => {
        zombie.update();
        zombie.draw();

        // Collision with Player
        const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
        if (dist - zombie.radius - player.radius < 1) {
            player.takeDamage(1); // Damage per frame contact
        }

        // Collision with Projectiles
        projectiles.forEach((projectile, pIndex) => {
            const dist = Math.hypot(projectile.x - zombie.x, projectile.y - zombie.y);

            if (dist - zombie.radius - projectile.radius < 1) {
                // Create explosion
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 2,
                        zombie.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 6),
                            y: (Math.random() - 0.5) * (Math.random() * 6)
                        }
                    ));
                }

                score += 10;
                scoreEl.innerHTML = score;

                setTimeout(() => {
                    zombies.splice(index, 1);
                    projectiles.splice(pIndex, 1);
                }, 0);
            }
        });
    });
}

// Game Control
function initGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    projectiles = [];
    zombies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    player.updateHealthUI();
    gameRunning = true;
    animate();
    spawnZombies();
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    clearInterval(spawnInterval);
    finalScoreEl.innerHTML = score;
    gameOverScreen.classList.remove('hidden');
}

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    initGame();
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    initGame();
});
