const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

let score = 0;

let level = 1;
let dropSpeed = 500;

let gameOver = false;
let gameStarted = false;
let gameTimer;
let paused = false;
let countdown = 0;

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");

const highScoreElement = document.getElementById("highScore");

let highScore = 0;
let newRecord = false;

highScoreElement.textContent = highScore;

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

let board = [];

function createBoard() {
    board = [];

    for (let row = 0; row < ROWS; row++) {
        board[row] = [];

        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

createBoard();



function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {

            if (board[row][col]) {
                ctx.fillStyle = board[row][col];

                ctx.fillRect(
                    col * BLOCK_SIZE,
                    row * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }

            ctx.strokeStyle = "#444";

            ctx.strokeRect(
                col * BLOCK_SIZE,
                row * BLOCK_SIZE,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }
}

drawBoard();

const pieces = [

    // I
    [
        [1, 1, 1, 1]
    ],

    // O
    [
        [1, 1],
        [1, 1]
    ],

    // T
    [
        [0, 1, 0],
        [1, 1, 1]
    ],

    // S
    [
        [0, 1, 1],
        [1, 1, 0]
    ],

    // Z
    [
        [1, 1, 0],
        [0, 1, 1]
    ],

    // J
    [
        [1, 0, 0],
        [1, 1, 1]
    ],

    // L
    [
        [0, 0, 1],
        [1, 1, 1]
    ]
];

const colors = [
    "cyan",     // I
    "yellow",   // O
    "purple",   // T
    "green",    // S
    "red",      // Z
    "blue",     // J
    "orange"    // L
];



function randomPiece() {
    const randomIndex = Math.floor(
        Math.random() * pieces.length
    );

    return {
        shape: pieces[randomIndex],
        color: colors[randomIndex]
    };
}

let random = randomPiece();

let piece = {
    shape: random.shape,
    color: random.color,
    row: 0,
    col: 3
};

let nextPiece = randomPiece();
drawNextPiece();



function drawPiece() {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col] === 1) {
                ctx.fillStyle = piece.color;
ctx.shadowColor = piece.color;
ctx.shadowBlur = 10;

ctx.fillRect(
    (piece.col + col) * BLOCK_SIZE,
    (piece.row + row) * BLOCK_SIZE,
    BLOCK_SIZE,
    BLOCK_SIZE
);

ctx.strokeStyle = "white";
ctx.lineWidth = 2;

ctx.strokeRect(
    (piece.col + col) * BLOCK_SIZE + 1,
    (piece.row + row) * BLOCK_SIZE + 1,
    BLOCK_SIZE - 2,
    BLOCK_SIZE - 2
);

ctx.shadowBlur = 0;
            }
        }
    }
}

drawPiece();

document.addEventListener("keydown", function(event) {

if (event.key === "ArrowLeft") {
    if (!collision(piece.row, piece.col - 1)) {
        piece.col--;
    }
}

if (event.key === "ArrowRight") {
    if (!collision(piece.row, piece.col + 1)) {
        piece.col++;
    }
}

if (event.key === "ArrowDown") {
    if (!collision(piece.row + 1, piece.col)) {
        piece.row++;
    }
}

if (event.code === "Space") {
    event.preventDefault();

    while (!collision(piece.row + 1, piece.col)) {
        piece.row++;
    }

    mergePiece();
    clearLines();
    newPiece();
}

if (event.key === "ArrowUp") {
    rotatePiece();
}

    drawBoard();
    drawPiece();
    drawNewRecord();
});



function startGameTimer() {
    clearInterval(gameTimer);

    gameTimer = setInterval(function() {
        if (!gameStarted) return;
       if (paused) {
    drawBoard();
    drawPiece();
    drawNewRecord();
    drawPaused();
    return;
}

if (gameOver) {
    drawGameOver();
    return;
}

        if (!collision(piece.row + 1, piece.col)) {
            piece.row++;
        } else {
            mergePiece();
            clearLines();
            newPiece();

            if (collision(piece.row, piece.col)) {
                gameOver = true;
            }
        }

        drawBoard();
        drawPiece();
    }, dropSpeed);
}

startGameTimer();

function collision(row, col) {

    for (let r = 0; r < piece.shape.length; r++) {

        for (let c = 0; c < piece.shape[r].length; c++) {

            if (piece.shape[r][c] === 1) {

                let newRow = row + r;
                let newCol = col + c;

                // 撞到左右边界或底部
                if (
                    newRow >= ROWS ||
                    newCol < 0 ||
                    newCol >= COLS
                ) {
                    return true;
                }

                // 撞到已经固定的方块
               if (board[newRow][newCol]) {
    return true;
}
            }
        }
    }

    return false;
}

function mergePiece() {

    for (let row = 0; row < piece.shape.length; row++) {

        for (let col = 0; col < piece.shape[row].length; col++) {

            if (piece.shape[row][col] === 1) {

                board[piece.row + row][piece.col + col] = piece.color;

            }
        }
    }
}

function newPiece() {
    piece.shape = nextPiece.shape;
    piece.color = nextPiece.color;
    piece.row = 0;
    piece.col = 3;

    nextPiece = randomPiece();

    drawNextPiece();
}

function rotatePiece() {
    const oldShape = piece.shape;
    const rows = oldShape.length;
    const cols = oldShape[0].length;

    let newShape = [];

    for (let col = 0; col < cols; col++) {
        newShape[col] = [];

        for (let row = rows - 1; row >= 0; row--) {
            newShape[col].push(oldShape[row][col]);
        }
    }

    piece.shape = newShape;

    if (collision(piece.row, piece.col)) {
        piece.shape = oldShape;
    }
}

function clearLines() {

    for (let row = ROWS - 1; row >= 0; row--) {

        let full = true;

        for (let col = 0; col < COLS; col++) {

            if (board[row][col] === 0) {
                full = false;
                break;
            }
        }

if (full) {

    board.splice(row, 1);

    board.unshift(
        Array(COLS).fill(0)
    );

            score += 100;
scoreElement.textContent = score;

if (score >= highScore) {
    newRecord = true;

    highScore = score;
    highScoreElement.textContent = highScore;
    localStorage.setItem("highScore", highScore);
}

level = Math.floor(score / 500) + 1;
levelElement.textContent = level;

dropSpeed = Math.max(100, 500 - (level - 1) * 50);




            row++;
        }
    }
}

document.getElementById("startButton").addEventListener("click", function() {
    gameStarted = false;

    document.getElementById("startScreen").style.display = "none";

    countdown = 3;

    let countdownTimer = setInterval(function() {
        drawBoard();
        drawPiece();
        drawCountdown();

        countdown--;

        if (countdown < 0) {
    clearInterval(countdownTimer);
    gameStarted = true;
    startGameTimer();
}
    }, 1000);
});

function drawPaused() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "PAUSED",
        canvas.width / 2,
        canvas.height / 2
    );
}

function drawCountdown() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffff";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        countdown > 0 ? countdown : "GO!",
        canvas.width / 2,
        canvas.height / 2
    );
}

function drawNewRecord() {
    if (!newRecord) return;

    ctx.fillStyle = "#ffff00";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "NEW RECORD!",
        canvas.width / 2,
        canvas.height / 2 - 50
    );
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Press R to Restart",
        canvas.width / 2,
        canvas.height / 2 + 40
    );
}

document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "r" && gameOver) {
        location.reload();
    }
});


document.getElementById("restartButton").addEventListener("click", function() {
    location.reload();
});

document.getElementById("pauseButton").addEventListener("click", function() {
    if (!gameStarted || gameOver) return;

    paused = !paused;

    if (paused) {
        this.textContent = "RESUME";
    } else {
        this.textContent = "PAUSE";
    }
});

document.getElementById("leftButton").addEventListener("pointerdown", function(event) {
    event.preventDefault();

    if (!gameStarted || paused || gameOver) return;

    if (!collision(piece.row, piece.col - 1)) {
        piece.col--;
    }

    drawBoard();
    drawPiece();
});
document.getElementById("rightButton").addEventListener("pointerdown", function() {
    if (!gameStarted || paused || gameOver) return;

    if (!collision(piece.row, piece.col + 1)) {
        piece.col++;
    }

    drawBoard();
    drawPiece();
});

document.getElementById("downButton").addEventListener("pointerdown", function() {
    if (!gameStarted || paused || gameOver) return;

    if (!collision(piece.row + 1, piece.col)) {
        piece.row++;
    }

    drawBoard();
    drawPiece();
});

document.getElementById("rotateButton").addEventListener("pointerdown", function() {
    if (!gameStarted || paused || gameOver) return;

    rotatePiece();

    drawBoard();
    drawPiece();
});

document.getElementById("dropButton").addEventListener("pointerdown", function() {
    if (!gameStarted || paused || gameOver) return;

    while (!collision(piece.row + 1, piece.col)) {
        piece.row++;
    }

    mergePiece();
    clearLines();
    newPiece();

    drawBoard();
    drawPiece();
});

function drawNextPiece() {
    nextCtx.clearRect(
        0,
        0,
        nextCanvas.width,
        nextCanvas.height
    );

    nextCtx.fillStyle = nextPiece.color;

    const blockSize = 25;

    const width = nextPiece.shape[0].length * blockSize;
    const height = nextPiece.shape.length * blockSize;

    const startX = (nextCanvas.width - width) / 2;
    const startY = (nextCanvas.height - height) / 2;

    for (let row = 0; row < nextPiece.shape.length; row++) {
        for (let col = 0; col < nextPiece.shape[row].length; col++) {
            if (nextPiece.shape[row][col] === 1) {
                nextCtx.fillRect(
                    startX + col * blockSize,
                    startY + row * blockSize,
                    blockSize,
                    blockSize
                );
            }
        }
    }
}
