// script.js - Fixed capture bug

// Game State
const gameState = {
    currentPlayer: 'red',
    diceValue: 0,
    hasRolled: false,
    players: {
        red: { color: '#DC143C', startPos: 1 },
        blue: { color: '#1E90FF', startPos: 40 },
        green: { color: '#32CD32', startPos: 27 },
        yellow: { color: '#FFD700', startPos: 14 }
    },
    pawnPositions: {},
    gameStarted: false
};

// Cell positions on the board (1-52 main path)
const CELL_POSITIONS = {
    52: {col: 9, row: 2}, 51: {col: 9, row: 3}, 50: {col: 9, row: 4},
    49: {col: 9, row: 5}, 48: {col: 9, row: 6}, 47: {col: 9, row: 7},
    46: {col: 10, row: 7}, 45: {col: 11, row: 7}, 44: {col: 12, row: 7},
    43: {col: 13, row: 7}, 42: {col: 14, row: 7}, 41: {col: 15, row: 7},
    40: {col: 15, row: 8}, 39: {col: 15, row: 9}, 38: {col: 14, row: 9},
    37: {col: 13, row: 9}, 36: {col: 12, row: 9}, 35: {col: 11, row: 9},
    34: {col: 10, row: 9}, 33: {col: 9, row: 9}, 32: {col: 9, row: 10},
    31: {col: 9, row: 11}, 30: {col: 9, row: 12}, 29: {col: 9, row: 13},
    28: {col: 9, row: 14}, 27: {col: 9, row: 15}, 26: {col: 8, row: 15},
    25: {col: 7, row: 15}, 24: {col: 7, row: 14}, 23: {col: 7, row: 13},
    22: {col: 7, row: 12}, 21: {col: 7, row: 11}, 20: {col: 7, row: 10},
    19: {col: 7, row: 9}, 18: {col: 6, row: 9}, 17: {col: 5, row: 9},
    16: {col: 4, row: 9}, 15: {col: 3, row: 9}, 14: {col: 2, row: 9},
    13: {col: 1, row: 9}, 12: {col: 1, row: 8}, 11: {col: 1, row: 7},
    10: {col: 2, row: 7}, 9: {col: 3, row: 7}, 8: {col: 4, row: 7},
    7: {col: 5, row: 7}, 6: {col: 6, row: 7}, 5: {col: 7, row: 6},
    4: {col: 7, row: 5}, 3: {col: 7, row: 4}, 2: {col: 7, row: 3},
    1: {col: 7, row: 2}
};

// Safe positions (stars)
const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48];

// Each player's path
const PATHS = {
    red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    blue: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    green: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    yellow: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
};

// Initialize
function initBoard() {
    const board = document.getElementById('board');
    
    generateMainPath(board);
    generateHomeStraights(board);
    
    ['red', 'blue', 'green', 'yellow'].forEach(color => {
        for(let i = 0; i < 4; i++) {
            gameState.pawnPositions[`${color}-${i}`] = null;
        }
    });
    
    attachPawnHandlers();
    updateTurnIndicator();
}

function generateMainPath(board) {
    for(let i = 1; i <= 52; i++) {
        const pos = CELL_POSITIONS[i];
        if(!pos) continue;
        
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.style.gridColumn = pos.col;
        cell.style.gridRow = pos.row;
        
        const cellType = getCellType(pos.col, pos.row);
        cell.classList.add(cellType);
        
        if(SAFE_POSITIONS.includes(i)) {
            cell.classList.add('star-cell');
        }
        
        board.appendChild(cell);
    }
}

function generateHomeStraights(board) {
    for(let i = 1; i <= 5; i++) {
        const redCell = document.createElement('div');
        redCell.className = 'cell red-path-cell';
        redCell.id = `red-${i}`;
        redCell.style.gridColumn = 8;
        redCell.style.gridRow = 10 + i;
        board.appendChild(redCell);
        
        const blueCell = document.createElement('div');
        blueCell.className = 'cell blue-path-cell';
        blueCell.id = `blue-${i}`;
        blueCell.style.gridColumn = 9 + i;
        blueCell.style.gridRow = 8;
        board.appendChild(blueCell);
        
        const greenCell = document.createElement('div');
        greenCell.className = 'cell green-path-cell';
        greenCell.id = `green-${i}`;
        greenCell.style.gridColumn = 8;
        greenCell.style.gridRow = 7 - i;
        board.appendChild(greenCell);
        
        const yellowCell = document.createElement('div');
        yellowCell.className = 'cell yellow-path-cell';
        yellowCell.id = `yellow-${i}`;
        yellowCell.style.gridColumn = 7 - i;
        yellowCell.style.gridRow = 8;
        board.appendChild(yellowCell);
    }
}

function getCellType(col, row) {
    if(col === 7 && row >= 2 && row <= 7) return 'red-path-cell';
    if(row === 7 && col >= 2 && col <= 6) return 'red-path-cell';
    if(row === 9 && col >= 2 && col <= 6) return 'yellow-path-cell';
    if(col === 7 && row >= 9 && row <= 15) return 'yellow-path-cell';
    if(col === 9 && row >= 9 && row <= 15) return 'green-path-cell';
    if(row === 9 && col >= 10 && col <= 15) return 'green-path-cell';
    if(col === 9 && row >= 2 && row <= 7) return 'blue-path-cell';
    if(row === 7 && col >= 10 && col <= 15) return 'blue-path-cell';
    return 'white-cell';
}

function attachPawnHandlers() {
    document.querySelectorAll('.pawn').forEach(pawn => {
        pawn.style.cursor = 'pointer';
        pawn.onclick = function(e) {
            e.stopPropagation();
            handlePawnClick(this);
        };
    });
}

function rollDice() {
    if(gameState.hasRolled) return;
    
    const btn = document.getElementById('rollBtn');
    btn.disabled = true;
    
    let rolls = 0;
    const interval = setInterval(() => {
        showDiceFace(Math.floor(Math.random() * 6) + 1);
        rolls++;
        if(rolls >= 10) {
            clearInterval(interval);
            finalizeRoll();
        }
    }, 100);
}

function showDiceFace(value) {
    document.querySelectorAll('.dice-face').forEach(f => f.style.display = 'none');
    const face = document.querySelector(`.face-${value}`);
    if(face) face.style.display = 'grid';
}

function finalizeRoll() {
    gameState.diceValue = Math.floor(Math.random() * 6) + 1;
    showDiceFace(gameState.diceValue);
    gameState.hasRolled = true;
    
    const playerName = gameState.currentPlayer.toUpperCase();
    document.getElementById('gameInfo').textContent = 
        `${playerName} rolled ${gameState.diceValue}!`;
    
    if(!canMakeMove()) {
        setTimeout(() => {
            document.getElementById('gameInfo').textContent = 'No valid moves! Next player...';
            setTimeout(nextTurn, 1500);
        }, 1000);
    } else {
        highlightPlayablePawns();
        document.getElementById('gameInfo').textContent = 
            `Click a highlighted pawn to move ${gameState.diceValue} spaces`;
    }
    
    document.getElementById('rollBtn').disabled = false;
}

function canMakeMove() {
    const color = gameState.currentPlayer;
    for(let i = 0; i < 4; i++) {
        if(canMovePawn(color, i)) return true;
    }
    return false;
}

function canMovePawn(color, index) {
    const dice = gameState.diceValue;
    const pos = gameState.pawnPositions[`${color}-${index}`];
    
    if(pos === null) return dice === 6;
    
    if(typeof pos === 'string') {
        const num = parseInt(pos.split('-')[1]);
        return num + dice <= 5;
    }
    
    const path = PATHS[color];
    const idx = path.indexOf(pos);
    if(idx === -1) return false;
    
    const newIdx = idx + dice;
    if(newIdx >= 52) {
        return (newIdx - 52) < 5;
    }
    return true;
}

function highlightPlayablePawns() {
    document.querySelectorAll('.pawn').forEach(p => p.classList.remove('highlight'));
    
    const color = gameState.currentPlayer;
    for(let i = 0; i < 4; i++) {
        if(canMovePawn(color, i)) {
            const pawn = document.getElementById(`${color}-${i}`);
            if(pawn) pawn.classList.add('highlight');
        }
    }
}

function handlePawnClick(pawn) {
    if(!gameState.hasRolled) {
        document.getElementById('gameInfo').textContent = 'Roll the dice first!';
        return;
    }
    
    const pawnId = pawn.id;
    const [color, indexStr] = pawnId.split('-');
    const index = parseInt(indexStr);
    
    if(color !== gameState.currentPlayer) {
        document.getElementById('gameInfo').textContent = "Not your turn!";
        return;
    }
    
    if(!canMovePawn(color, index)) {
        document.getElementById('gameInfo').textContent = 'Invalid move!';
        return;
    }
    
    movePawn(pawnId, color, index);
}

function movePawn(pawnId, color, index) {
    const dice = gameState.diceValue;
    const currentPos = gameState.pawnPositions[pawnId];
    const pawnElement = document.getElementById(pawnId);
    
    if(!pawnElement) return;
    
    const parent = pawnElement.parentElement;
    if(parent) parent.removeChild(pawnElement);
    
    let newPos;
    let captured = false;
    
    if(currentPos === null) {
        newPos = gameState.players[color].startPos;
    } else if(typeof currentPos === 'string') {
        const num = parseInt(currentPos.split('-')[1]);
        newPos = `${color}-${num + dice}`;
    } else {
        const path = PATHS[color];
        const idx = path.indexOf(currentPos);
        const newIdx = idx + dice;
        
        if(newIdx >= 52) {
            newPos = `${color}-${newIdx - 51}`;
        } else {
            newPos = path[newIdx];
            captured = checkCapture(newPos, color);
        }
    }
    
    gameState.pawnPositions[pawnId] = newPos;
    placePawn(pawnElement, newPos);
    
    if(captured) {
        document.getElementById('gameInfo').textContent = 
            `${color.toUpperCase()} captured an opponent!`;
    }
    
    document.querySelectorAll('.pawn').forEach(p => p.classList.remove('highlight'));
    
    if(dice === 6) {
        setTimeout(() => {
            document.getElementById('gameInfo').textContent = 'Rolled 6! Roll again!';
            gameState.hasRolled = false;
            showDiceFace(1);
        }, 500);
    } else {
        setTimeout(nextTurn, 1000);
    }
    
    checkWin();
}

function placePawn(pawnElement, pos) {
    let container;
    
    if(pos === null) {
        const [color, index] = pawnElement.id.split('-');
        container = document.getElementById(`${color}-slot-${index}`);
    } else if(typeof pos === 'string') {
        container = document.getElementById(pos);
    } else {
        container = document.getElementById(`cell-${pos}`);
    }
    
    if(container) {
        container.appendChild(pawnElement);
    }
}

// FIXED CAPTURE FUNCTION - Sends the OPPONENT home, not the attacker
function checkCapture(pos, currentColor) {
    // Don't capture on safe positions
    if(SAFE_POSITIONS.includes(pos)) return false;
    
    let captured = false;
    
    // Check all opponent pawns at this position
    ['red', 'blue', 'green', 'yellow'].forEach(color => {
        if(color === currentColor) return;
        
        for(let i = 0; i < 4; i++) {
            const opponentPawnId = `${color}-${i}`;
            const opponentPos = gameState.pawnPositions[opponentPawnId];
            
            // If opponent is at this position, send THEM home
            if(opponentPos === pos) {
                sendPawnHome(opponentPawnId, color, i);
                captured = true;
            }
        }
    });
    
    return captured;
}

// FIXED SEND HOME FUNCTION - Sends the specified pawn home
function sendPawnHome(pawnId, color, index) {
    const pawnElement = document.getElementById(pawnId);
    if(!pawnElement) return;
    
    // Remove from current position
    const parent = pawnElement.parentElement;
    if(parent) parent.removeChild(pawnElement);
    
    // Reset position to null (in home)
    gameState.pawnPositions[pawnId] = null;
    
    // Place back in home slot
    const homeSlot = document.getElementById(`${color}-slot-${index}`);
    if(homeSlot) {
        homeSlot.appendChild(pawnElement);
    }
}

function nextTurn() {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const idx = colors.indexOf(gameState.currentPlayer);
    gameState.currentPlayer = colors[(idx + 1) % 4];
    gameState.hasRolled = false;
    gameState.diceValue = 0;
    
    showDiceFace(1);
    updateTurnIndicator();
    document.getElementById('gameInfo').textContent = 
        `${gameState.currentPlayer.toUpperCase()}'s turn - Roll the dice!`;
    
    document.querySelectorAll('.pawn').forEach(p => p.classList.remove('highlight'));
}

function updateTurnIndicator() {
    const ind = document.getElementById('turnIndicator');
    ind.textContent = `${gameState.currentPlayer.toUpperCase()}'s Turn`;
    ind.style.background = gameState.players[gameState.currentPlayer].color;
}

function checkWin() {
    ['red', 'blue', 'green', 'yellow'].forEach(color => {
        let homeCount = 0;
        for(let i = 0; i < 4; i++) {
            if(gameState.pawnPositions[`${color}-${i}`] === `${color}-5`) {
                homeCount++;
            }
        }
        if(homeCount === 4) {
            document.getElementById('gameInfo').innerHTML = 
                `<span style="font-size:24px;">🎉 ${color.toUpperCase()} WINS! 🎉</span>`;
            document.getElementById('rollBtn').disabled = true;
        }
    });
}

window.onload = initBoard;