// script.js
const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece-canvas');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const grid = [];
const gridRows = 20;
const gridCols = 10;
const blockSize = 20;
const nextPieceBlockSize = nextCanvas.width / 4; // Ajustar tamanho para o canvas menor

let currentPiece = null;
let nextPiece = null; // Variável para a próxima peça
let gameInterval;
const gameSpeed = 500;
let score = 0;

const colors = [
    null, 'cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'
];

const shapes = [
    [[0,0],[0,-1],[0,1],[0,2]], // I
    [[0,0],[-1,0],[1,0],[1,-1]], // L
    [[0,0],[-1,0],[1,0],[1,1]],  // J
    [[0,0],[-1,0],[0,-1],[1,-1]], // S
    [[0,0],[-1,-1],[0,-1],[1,0]], // Z
    [[0,0],[-1,0],[0,-1],[1,0]], // T
    [[0,0],[0,-1],[1,0],[1,-1]]  // O
];

function createGrid() {
    for (let y = 0; y < gridRows; y++) {
        grid[y] = [];
        for (let x = 0; x < gridCols; x++) {
            grid[y][x] = 0;
        }
    }
}

function createPiece() {
    const randomShapeIndex = Math.floor(Math.random() * shapes.length);
    const shape = shapes[randomShapeIndex];
    return {
        shape: shape,
        color: colors[randomShapeIndex + 1],
        x: Math.floor(gridCols / 2) - Math.ceil(shape.reduce((max, coord) => Math.max(max, coord[0]), 0) / 2),
        y: 0
    };
}

function drawBlock(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
    ctx.strokeStyle = '#444'; // Cor cinza para as linhas do grid (igual à borda)
    ctx.strokeRect(x * size, y * size, size, size);
}

function drawGrid() {
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(context, x, y, colors[value], blockSize);
            } else {
                // Desenhar apenas a linha do grid para células vazias
                context.strokeStyle = '#444';
                context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        });
    });
}

function drawPiece() {
    if (currentPiece) {
        currentPiece.shape.forEach(block => {
            drawBlock(context, currentPiece.x + block[0], currentPiece.y + block[1], currentPiece.color, blockSize);
        });
    }
}

function drawNextPiece() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece && nextPiece.shape) {
        const minX = Math.min(...nextPiece.shape.map(coord => coord[0]));
        const maxX = Math.max(...nextPiece.shape.map(coord => coord[0]));
        const minY = Math.min(...nextPiece.shape.map(coord => coord[1]));
        const maxY = Math.max(...nextPiece.shape.map(coord => coord[1]));

        const pieceWidth = maxX - minX + 1;
        const pieceHeight = maxY - minY + 1;

        const offsetX = Math.floor((nextCanvas.width / nextPieceBlockSize - pieceWidth) / 2) - minX;
        const offsetY = Math.floor((nextCanvas.height / nextPieceBlockSize - pieceHeight) / 2) - minY;

        nextPiece.shape.forEach(block => {
            drawBlock(nextContext, offsetX + block[0], offsetY + block[1], nextPiece.color, nextPieceBlockSize);
        });
    }
}
function movePiece(dx, dy) {
    if (!currentPiece) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;

    if (!collision(currentPiece.shape, newX, newY)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
    } else if (dy > 0) {
        freezePiece();
        currentPiece = nextPiece; // A próxima peça se torna a atual
        nextPiece = createPiece(); // Criar uma nova próxima peça
        drawNextPiece(); // Desenhar a nova próxima peça
        if (collision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver();
        }
    }
}

function rotatePiece() {
    if (!currentPiece) return;
    const shape = currentPiece.shape;
    const newShape = [];
    const len = shape.length;
    for (let i = 0; i < len; i++) {
        const x = shape[i][0];
        const y = shape[i][1];
        newShape.push([-y, x]);
    }

    if (!collision(newShape, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = newShape;
    }
}

function collision(shape, x, y) {
    for (let block of shape) {
        const newX = x + block[0];
        const newY = y + block[1];

        if (newY >= gridRows || newX < 0 || newX >= gridCols) {
            return true;
        }
        if (newY >= 0 && grid[newY] && grid[newY][newX] !== 0) {
            return true;
        }
    }
    return false;
}

function freezePiece() {
    currentPiece.shape.forEach(block => {
        grid[currentPiece.y + block[1]][currentPiece.x + block[0]] = colors.indexOf(currentPiece.color);
    });
    clearLines();
}

function clearLines() {
    let linesCleared = 0;
    for (let y = gridRows - 1; y >= 0; y--) {
        if (grid[y].every(value => value !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(gridCols).fill(0));
            linesCleared++;
        }
    }

    if (linesCleared > 0) {
        score += linesCleared * 100;
        updateScoreDisplay();
    }
}

function updateScoreDisplay() {
    scoreElement.textContent = score;
}

function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPiece();
    movePiece(0, 1);
}

function startGame() {
    createGrid();
    currentPiece = createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    score = 0;
    updateScoreDisplay();
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);
}

function pauseGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    } else {
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
}

function gameOver() {
    clearInterval(gameInterval);
    alert(`Fim de Jogo! Pontuação final: ${score}`);
    startGame();
}

// Event Listeners para os botões
document.getElementById('left').addEventListener('click', () => movePiece(-1, 0));
document.getElementById('right').addEventListener('click', () => movePiece(1, 0));
document.getElementById('down').addEventListener('click', () => movePiece(0, 1));
document.getElementById('rotate').addEventListener('click', rotatePiece);
document.getElementById('pause').addEventListener('click', pauseGame);
document.getElementById('restart').addEventListener('click', startGame);

// Inicializar o jogo
startGame();

// Opcional: Controles por teclado (para teste no desktop)
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'p':
            pauseGame();
            break;
        case 'r':
            startGame();
            break;
    }
});

