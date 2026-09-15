let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playSound(frequency, duration, type = "square", volume = 0.08) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function playStartSound() {
    playSound(523, 0.08);
    
    setTimeout(() => {
        playSound(659, 0.08);
    }, 90);
}

function playEatSound() {
    playSound(700, 0.07);
    
    setTimeout(() => {
        playSound(900, 0.06);
    }, 70);
}

function playGameOverSound() {
    playSound(300, 0.15);
    
    setTimeout(() => {
        playSound(200, 0.25);
    }, 160);
}

function playPauseSound() {
    playSound(450, 0.08);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement =
    document.getElementById("score");

const highScoreElement =
    document.getElementById("highScore");

const levelElement =
    document.getElementById("level");

const startButton =
    document.getElementById("startButton");

const restartButton =
    document.getElementById("restartButton");

const pauseButton =
    document.getElementById("pauseButton");

const startScreen =
    document.getElementById("startScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const finalScore =
    document.getElementById("finalScore");

const finalHighScore =
    document.getElementById("finalHighScore");

const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const gridSize = 20;


// ====================
// 游戏变量
// ====================

let snake = [
    { x: 200, y: 200 },
    { x: 180, y: 200 },
    { x: 160, y: 200 }
];

let food = {
    x: 100,
    y: 100
};

let direction = "right";

let score = 0;

let highScore =
    Number(localStorage.getItem("snakeHighScore")) || 0;

let gameRunning = false;
let gamePaused = false;

let gameTimer;

let currentLevel = 1;

let gameSpeed = 150;


// 显示最高分
highScoreElement.textContent = highScore;


// ====================
// 画蛇
// ====================

function drawSnake() {
    snake.forEach((segment, index) => {

        // 蛇头
        if (index === 0) {
            ctx.fillStyle = "#4CAF50";
            ctx.fillRect(segment.x, segment.y, 20, 20);

            // 眼睛
            ctx.fillStyle = "#000";

            if (direction === "right") {
                ctx.fillRect(segment.x + 14, segment.y + 4, 3, 3);
                ctx.fillRect(segment.x + 14, segment.y + 13, 3, 3);
            } else if (direction === "left") {
                ctx.fillRect(segment.x + 3, segment.y + 4, 3, 3);
                ctx.fillRect(segment.x + 3, segment.y + 13, 3, 3);
            } else if (direction === "up") {
                ctx.fillRect(segment.x + 4, segment.y + 3, 3, 3);
                ctx.fillRect(segment.x + 13, segment.y + 3, 3, 3);
            } else if (direction === "down") {
                ctx.fillRect(segment.x + 4, segment.y + 14, 3, 3);
                ctx.fillRect(segment.x + 13, segment.y + 14, 3, 3);
            }

        } else {
            // 蛇身体
            ctx.fillStyle = "#66BB6A";
            ctx.fillRect(segment.x + 1, segment.y + 1, 18, 18);
        }
    });
}


// ====================
// 画食物
// ====================

function drawFood() {
    // 苹果
    ctx.fillStyle = "#ff3333";

    ctx.fillRect(food.x + 4, food.y + 5, 12, 12);
    ctx.fillRect(food.x + 2, food.y + 8, 16, 7);

    // 苹果梗
    ctx.fillStyle = "#6b3e26";
    ctx.fillRect(food.x + 9, food.y + 1, 3, 5);

    // 叶子
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(food.x + 12, food.y + 2, 5, 3);
}

// ====================
// 生成食物
// ====================

function generateFood() {

    const maxPosition =
        canvas.width / gridSize;

    food.x =
        Math.floor(Math.random() * maxPosition)
        * gridSize;

    food.y =
        Math.floor(Math.random() * maxPosition)
        * gridSize;
}

// ====================
// 等级系统
// ====================

function updateLevel() {

    let newLevel;

    if (score >= 20) {
        newLevel = 4;
    } else if (score >= 10) {
        newLevel = 3;
    } else if (score >= 5) {
        newLevel = 2;
    } else {
        newLevel = 1;
    }

    // 没有升级就不用重新设置速度
    if (newLevel === currentLevel) {
        return;
    }

    currentLevel = newLevel;

    levelElement.textContent = currentLevel;

    // 等级越高，速度越快
    if (currentLevel === 1) {
        gameSpeed = 150;
    }

    if (currentLevel === 2) {
        gameSpeed = 120;
    }

    if (currentLevel === 3) {
        gameSpeed = 90;
    }

    if (currentLevel === 4) {
        gameSpeed = 65;
    }

    // 重新启动游戏计时器
    clearInterval(gameTimer);

    gameTimer = setInterval(
        gameLoop,
        gameSpeed
    );
}


// ====================
// 撞墙
// ====================

function checkWallCollision(head) {

    return (
        head.x < 0 ||
        head.x >= canvas.width ||
        head.y < 0 ||
        head.y >= canvas.height
    );
}


// ====================
// 撞自己
// ====================

function checkSelfCollision(head) {

    for (let i = 1; i < snake.length; i++) {

        if (
            head.x === snake[i].x &&
            head.y === snake[i].y
        ) {
            return true;
        }
    }

    return false;
}


// ====================
// 移动蛇
// ====================

function moveSnake() {

    const head = {
        x: snake[0].x,
        y: snake[0].y
    };


    if (direction === "up") {
        head.y -= gridSize;
    }

    if (direction === "down") {
        head.y += gridSize;
    }

    if (direction === "left") {
        head.x -= gridSize;
    }

    if (direction === "right") {
        head.x += gridSize;
    }


    // 撞墙
    if (checkWallCollision(head)) {
        gameOver();
        return;
    }


    // 撞自己
    if (checkSelfCollision(head)) {
        gameOver();
        return;
    }


    snake.unshift(head);


    // 吃食物
    if (
        head.x === food.x &&
        head.y === food.y
    ) {

score++;

playEatSound();
showEatEffect();

scoreElement.textContent = score;

// 检查是否升级
updateLevel();

        // 更新最高分
if (score > highScore) {
    highScore = score;

    localStorage.setItem("snakeHighScore", highScore);

    highScoreElement.textContent = highScore;

    showNewHighScore();
}

        generateFood();

    } else {

        snake.pop();
    }
}


// ====================
// 游戏画面
// ====================

function drawGame() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawSnake();
    drawFood();
}

function drawGrid() {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}


// ====================
// 游戏循环
// ====================

function gameLoop() {

    if (!gameRunning || gamePaused) {
        return;
    }

    moveSnake();

    if (gameRunning) {
        drawGame();
    }
}


// ====================
// Game Over
// ====================

function gameOver() {

    playGameOverSound();

    gameRunning = false;
    gamePaused = false;

    clearInterval(gameTimer);

    pauseButton.style.display = "none";

    // 显示最终分数
    finalScore.textContent = score;

    finalHighScore.textContent = highScore;

    // 显示 Game Over
    gameOverScreen.classList.remove("hidden");
}


// ====================
// 开始 / 重新开始
// ====================

function startGame() {

    initAudio();
playStartSound();

    clearInterval(gameTimer);

    // 重置蛇
    snake = [
        { x: 200, y: 200 },
        { x: 180, y: 200 },
        { x: 160, y: 200 }
    ];

    // 重置方向
    direction = "right";

    // 重置分数
    score = 0;

    scoreElement.textContent = score;

    // 重置等级
    currentLevel = 1;
    gameSpeed = 150;

    levelElement.textContent = currentLevel;

    // 生成食物
    generateFood();

    // 游戏状态
    gameRunning = true;
    gamePaused = false;

    // 隐藏开始和 Game Over
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    // 显示暂停
    pauseButton.style.display = "inline-block";

    pauseButton.textContent = "⏸ Pause";

    // 开始游戏
    gameTimer = setInterval(
        gameLoop,
        gameSpeed
    );

    drawGame();
}


// 开始按钮
startButton.addEventListener(
    "click",
    startGame
);


// 再玩一次
restartButton.addEventListener(
    "click",
    startGame
);


// ====================
// 暂停 / 继续
// ====================

pauseButton.addEventListener("click", function() {

    playPauseSound();

    if (!gameRunning) {
        return;
    }

    gamePaused = !gamePaused;

    if (gamePaused) {

        pauseButton.textContent = "Resume";

    } else {

        pauseButton.textContent = "Pause";
    }
});

function playHighScoreSound() {
    playSound(800, 0.08);

    setTimeout(() => {
        playSound(1000, 0.08);
    }, 90);

    setTimeout(() => {
        playSound(1200, 0.12);
    }, 180);
}

// ====================
// 键盘控制
// ====================

document.addEventListener("keydown", function(event) {

    if (
        event.key === "ArrowUp" &&
        direction !== "down"
    ) {
        direction = "up";
    }

    if (
        event.key === "ArrowDown" &&
        direction !== "up"
    ) {
        direction = "down";
    }

    if (
        event.key === "ArrowLeft" &&
        direction !== "right"
    ) {
        direction = "left";
    }

    if (
        event.key === "ArrowRight" &&
        direction !== "left"
    ) {
        direction = "right";
    }
});


// ====================
// 手机按钮
// ====================

upButton.addEventListener("click", function() {

    if (direction !== "down") {
        direction = "up";
    }
});

downButton.addEventListener("click", function() {

    if (direction !== "up") {
        direction = "down";
    }
});

leftButton.addEventListener("click", function() {

    if (direction !== "right") {
        direction = "left";
    }
});

rightButton.addEventListener("click", function() {

    if (direction !== "left") {
        direction = "right";
    }
});


// ====================
// 手机滑动
// ====================

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener(
    "touchstart",
    function(event) {

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

    },
    { passive: true }
);


canvas.addEventListener(
    "touchend",
    function(event) {

        const touch = event.changedTouches[0];

        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;

        const differenceX =
            touchEndX - touchStartX;

        const differenceY =
            touchEndY - touchStartY;

        const minimumSwipe = 30;


        if (
            Math.abs(differenceX) <
            minimumSwipe &&
            Math.abs(differenceY) <
            minimumSwipe
        ) {
            return;
        }


        if (
            Math.abs(differenceX) >
            Math.abs(differenceY)
        ) {

            if (
                differenceX > 0 &&
                direction !== "left"
            ) {
                direction = "right";
            }

            if (
                differenceX < 0 &&
                direction !== "right"
            ) {
                direction = "left";
            }

        } else {

            if (
                differenceY > 0 &&
                direction !== "up"
            ) {
                direction = "down";
            }

            if (
                differenceY < 0 &&
                direction !== "down"
            ) {
                direction = "up";
            }
        }

    },
    { passive: true }
);


// ====================
// 第一次显示
// ====================

drawGame();

function showNewHighScore() {
    const newHighScore = document.getElementById("newHighScore");

    newHighScore.classList.remove("hidden");

    playHighScoreSound();

    setTimeout(() => {
        newHighScore.classList.add("hidden");
    }, 1500);
}

function showEatEffect() {
    const effect = document.getElementById("eatEffect");

    effect.classList.remove("hidden");

    // 重新启动动画
    effect.style.animation = "none";
    void effect.offsetWidth;
    effect.style.animation = "eatPop 0.45s ease-out";

    setTimeout(() => {
        effect.classList.add("hidden");
    }, 450);
}