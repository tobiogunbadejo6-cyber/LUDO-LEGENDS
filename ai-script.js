// ai-script.js - Complete AI game logic

// AI Game Configuration
let isAITurn = false;

// Wait for script.js to load
window.addEventListener('load', function() {
    // Override functions after original script loads
    setTimeout(overrideFunctions, 100);
});

function overrideFunctions() {
    // Store original nextTurn
    const originalNextTurn = window.nextTurn;
    
    // Override nextTurn
    window.nextTurn = function() {
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
        
        // Enable roll button for human
        document.getElementById('rollBtn').disabled = false;
        
        // Check if it's AI's turn
        if(aiPlayers.includes(gameState.currentPlayer)) {
            isAITurn = true;
            document.getElementById('rollBtn').disabled = true;
            setTimeout(aiTurn, 1500);
        } else {
            isAITurn = false;
        }
    };
}

// AI Turn
function aiTurn() {
    if(!isAITurn) return;
    
    const color = gameState.currentPlayer;
    const btn = document.getElementById('rollBtn');
    btn.disabled = true;
    
    document.getElementById('gameInfo').textContent = 
        `${color.toUpperCase()} (AI) is rolling...`;
    
    // Animate dice roll
    let rolls = 0;
    const interval = setInterval(() => {
        showDiceFace(Math.floor(Math.random() * 6) + 1);
        rolls++;
        
        if(rolls >= 10) {
            clearInterval(interval);
            finishAIRoll(color);
        }
    }, 100);
}

function finishAIRoll(color) {
    // Set final roll
    gameState.diceValue = Math.floor(Math.random() * 6) + 1;
    showDiceFace(gameState.diceValue);
    gameState.hasRolled = true;
    
    document.getElementById('gameInfo').textContent = 
        `${color.toUpperCase()} (AI) rolled ${gameState.diceValue}!`;
    
    // Check if AI can move
    setTimeout(() => {
        let canMove = false;
        for(let i = 0; i < 4; i++) {
            if(canMovePawn(color, i)) {
                canMove = true;
                break;
            }
        }
        
        if(!canMove) {
            document.getElementById('gameInfo').textContent = 
                `${color.toUpperCase()} (AI) has no valid moves!`;
            setTimeout(nextTurn, 1500);
        } else {
            makeAIMove(color);
        }
    }, 800);
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

function makeAIMove(color) {
    const dice = gameState.diceValue;
    let bestPawn = -1;
    let bestScore = -9999;
    
    // Find best move
    for(let i = 0; i < 4; i++) {
        if(canMovePawn(color, i)) {
            const score = evaluateMove(color, i, dice);
            if(score > bestScore) {
                bestScore = score;
                bestPawn = i;
            }
        }
    }
    
    if(bestPawn >= 0) {
        const pawnId = `${color}-${bestPawn}`;
        const pawnElement = document.getElementById(pawnId);
        
        // Highlight
        pawnElement.classList.add('highlight');
        document.getElementById('gameInfo').textContent = 
            `${color.toUpperCase()} (AI) is moving...`;
        
        setTimeout(() => {
            executeMove(pawnId, color, bestPawn);
        }, 1000);
    }
}

function evaluateMove(color, pawnIndex, dice) {
    const pawnId = `${color}-${pawnIndex}`;
    const currentPos = gameState.pawnPositions[pawnId];
    let score = Math.random() * 10; // Small random factor
    
    // Getting out of home is high priority
    if(currentPos === null && dice === 6) {
        score += 100;
    }
    
    // Calculate where pawn will land
    let newPos;
    if(currentPos === null) {
        newPos = gameState.players[color].startPos;
    } else if(typeof currentPos === 'string') {
        const num = parseInt(currentPos.split('-')[1]);
        newPos = `${color}-${num + dice}`;
        if(num + dice === 5) score += 200; // Reaching home
    } else {
        const path = PATHS[color];
        const idx = path.indexOf(currentPos);
        const newIdx = idx + dice;
        
        if(newIdx >= 52) {
            newPos = `${color}-${newIdx - 51}`;
            score += 150; // Entering home straight
        } else {
            newPos = path[newIdx];
        }
    }
    
    // Capturing opponent
    if(typeof newPos === 'number') {
        const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
        if(!safePositions.includes(newPos)) {
            ['red', 'blue', 'green', 'yellow'].forEach(c => {
                if(c === color) return;
                for(let i = 0; i < 4; i++) {
                    if(gameState.pawnPositions[`${c}-${i}`] === newPos) {
                        score += 80;
                    }
                }
            });
        }
        
        // Safe positions are good
        if(safePositions.includes(newPos)) {
            score += 30;
        }
        
        // Progress
        const path = PATHS[color];
        const idx = path.indexOf(newPos);
        score += idx;
    }
    
    // Difficulty
    if(aiDifficulty === 'easy') {
        score *= 0.8;
    } else if(aiDifficulty === 'hard') {
        score *= 1.2;
    }
    
    return score;
}

function executeMove(pawnId, color, index) {
    const dice = gameState.diceValue;
    const currentPos = gameState.pawnPositions[pawnId];
    const pawnElement = document.getElementById(pawnId);
    
    if(!pawnElement) return;
    
    // Remove from current
    const parent = pawnElement.parentElement;
    if(parent) parent.removeChild(pawnElement);
    
    let newPos;
    let captured = false;
    const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
    
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
            
            // Check capture
            if(!safePositions.includes(newPos)) {
                ['red', 'blue', 'green', 'yellow'].forEach(c => {
                    if(c === color) return;
                    for(let i = 0; i < 4; i++) {
                        const oppId = `${c}-${i}`;
                        if(gameState.pawnPositions[oppId] === newPos) {
                            // Send opponent home
                            const oppElem = document.getElementById(oppId);
                            const oppParent = oppElem.parentElement;
                            if(oppParent) oppParent.removeChild(oppElem);
                            gameState.pawnPositions[oppId] = null;
                            document.getElementById(`${c}-slot-${i}`).appendChild(oppElem);
                            captured = true;
                        }
                    }
                });
            }
        }
    }
    
    // Place pawn
    gameState.pawnPositions[pawnId] = newPos;
    
    if(newPos === null) {
        document.getElementById(`${color}-slot-${index}`).appendChild(pawnElement);
    } else if(typeof newPos === 'string') {
        document.getElementById(newPos).appendChild(pawnElement);
    } else {
        document.getElementById(`cell-${newPos}`).appendChild(pawnElement);
    }
    
    // Clear highlight
    pawnElement.classList.remove('highlight');
    
    // Message
    if(captured) {
        document.getElementById('gameInfo').textContent = 
            `${color.toUpperCase()} (AI) captured your pawn!`;
    }
    
    // Check win
    let homeCount = 0;
    for(let i = 0; i < 4; i++) {
        if(gameState.pawnPositions[`${color}-${i}`] === `${color}-5`) {
            homeCount++;
        }
    }
    if(homeCount === 4) {
        document.getElementById('gameInfo').innerHTML = 
            `<span style="font-size:24px;">🎉 ${color.toUpperCase()} (AI) WINS! 🎉</span>`;
        document.getElementById('rollBtn').disabled = true;
        return;
    }
    
    // Continue or next turn
    if(dice === 6) {
        setTimeout(() => {
            document.getElementById('gameInfo').textContent = 
                `${color.toUpperCase()} (AI) plays again!`;
            gameState.hasRolled = false;
            showDiceFace(1);
            setTimeout(aiTurn, 1500);
        }, 1000);
    } else {
        isAITurn = false;
        setTimeout(nextTurn, 1000);
    }
}