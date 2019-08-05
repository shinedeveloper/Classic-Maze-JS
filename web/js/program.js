//-----------------------------------------------------------------------------
// Shared
//-----------------------------------------------------------------------------

var BirdOrientation = Object.freeze({EAST: 0, WEST: 1, NORTH: 2, SOUTH: 3});
var Command = Object.freeze({
    MOVE_FORWARD: { ordinal: 0, detectInfiniteLoop: true },
    TURN_LEFT: { ordinal: 1, detectInfiniteLoop: true },
    TURN_RIGHT: { ordinal: 2, detectInfiniteLoop: true },
    PIG_EXPLODE: { ordinal: 3, detectInfiniteLoop: false },
    BIRD_EXPLODE: { ordinal: 4, detectInfiniteLoop: false },
    WIN: { ordinal: 5, detectInfiniteLoop: false },
    LOSE: { ordinal: 6, detectInfiniteLoop: false },
    NOT_YET_THERE: { ordinal: 7, detectInfiniteLoop: false },
    INFINITE_LOOP: { ordinal: 8, detectInfiniteLoop: false }
});
var Cell = Object.freeze({EMPTY: 0, WOODEN_BOX: 1, STONE_BOX: 2, WOODEN_TRIANGLE: 3, STONE_TRIANGLE: 4, GLASS_TRIANGLE: 5, TNT: 6});

var replayCommandQueue = {
    queue: [],
    position: 0,
    add: function (command) {
        this.queue.push(command);
        if (this.queue.length > 100 && command.detectInfiniteLoop) {
            throw new InfiniteLoopException();
        }
    },
    hasNext: function () {
        return this.position < this.queue.length;
    },
    next: function () {
        return this.queue[this.position++];
    }
};

var model = {
    cells: [
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY],
        [Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY, Cell.EMPTY]
    ],
    challenge: "",
    bird: {x: 0, y: 0, direction: BirdOrientation.EAST},
    pig: {x: 7, y: 7}
};

var userCodeName;

//-----------------------------------------------------------------------------
// General Visual
//-----------------------------------------------------------------------------

var playButtonElement = document.querySelector("#playButton");
var runningButtonElement = document.querySelector("#runningButton");
var resetButtonElement = document.querySelector("#resetButton");
var bubbleElement = document.querySelector(".communication .bubble-text");
var birdElement = document.querySelector("#red");
var pigElement = document.querySelector("#pig");
var gameboardTableElement = document.querySelector("#gameboard table");

function enablePlayButton() {
    playButtonElement.classList.remove("invisible");
    runningButtonElement.classList.add("invisible");
    resetButtonElement.classList.add("invisible");
}

function disablePlayButton() {
    playButtonElement.classList.add("invisible");
    runningButtonElement.classList.remove("invisible");
    resetButtonElement.classList.add("invisible");
}

function resetPlayButton() {
    playButtonElement.classList.add("invisible");
    runningButtonElement.classList.add("invisible");
    resetButtonElement.classList.remove("invisible");
}

function setBubbleText(text) {
    bubbleElement.innerHTML = text;
}

function showGameboard() {
    for (var y = 0; y < model.cells.length; y++) {
        for (var x = 0; x < model.cells[y].length; x++) {
            var currentTdElement = gameboardTableElement.rows[y].cells.item(x);
            if (model.cells[y][x] === Cell.WOODEN_BOX) {
                currentTdElement.className = "cell-wooden-box";
            } else if (model.cells[y][x] === Cell.STONE_BOX) {
                currentTdElement.className = "cell-stone-box";
            } else if (model.cells[y][x] === Cell.WOODEN_TRIANGLE) {
                currentTdElement.className = "cell-wooden-triangle";
            } else if (model.cells[y][x] === Cell.STONE_TRIANGLE) {
                currentTdElement.className = "cell-stone-triangle";
            } else if (model.cells[y][x] === Cell.GLASS_TRIANGLE) {
                currentTdElement.className = "cell-glass-triangle";
            } else if (model.cells[y][x] === Cell.TNT) {
                currentTdElement.className = "cell-tnt";
            } else if (model.cells[y][x] === Cell.EMPTY) {
                currentTdElement.className = "";
            }
        }
    }
    setBubbleText(model.challenge);
    showBird();
    showPig();
}

function showBird() {
    visualBirdLeft = (model.bird.x * 50);
    visualBirdTop = (model.bird.y * 50);
    birdElement.style.left = visualBirdLeft + "px";
    birdElement.style.top = (visualBirdTop - 17) + "px";
    if (model.bird.direction === BirdOrientation.EAST) {
        birdElement.className = "red-right";
        visualBirdOrientation = BirdOrientation.EAST;
    } else if (model.bird.direction === BirdOrientation.WEST) {
        birdElement.className = "red-left";
        visualBirdOrientation = BirdOrientation.WEST;
    } else if (model.bird.direction === BirdOrientation.NORTH) {
        birdElement.className = "red-up";
        visualBirdOrientation = BirdOrientation.NORTH;
    } else if (model.bird.direction === BirdOrientation.SOUTH) {
        birdElement.className = "red-down";
        visualBirdOrientation = BirdOrientation.SOUTH;
    }
}

function showPig() {
    pigElement.style.left = (model.pig.x * 50 + 6) + "px";
    pigElement.style.top = (model.pig.y * 50 + 8) + "px";
    pigElement.className = "pig-idle";
}

//-----------------------------------------------------------------------------
// Visual Replay
//-----------------------------------------------------------------------------

var visualReplayTimer;
var visualBirdOrientation = BirdOrientation.EAST;
var visualBirdLeft = 150;
var visualBirdTop = 150;
var visualBirdAnimationFrame = 0;
var visualBirdAnimationTimer = null;

function showReplay() {
    visualReplayTimer = setInterval(replayOneStep, 100);
}

function replayOneStep() {
    if (isReady()) {
        if (replayCommandQueue.hasNext()) {
            var command = replayCommandQueue.next();
            if (command === Command.MOVE_FORWARD) {
                showMove();
            } else if (command === Command.TURN_RIGHT) {
                showTurnRight();
            } else if (command === Command.TURN_LEFT) {
                showTurnLeft();
            } else if (command === Command.PIG_EXPLODE) {
                showPigExplode();
            } else if (command === Command.BIRD_EXPLODE) {
                showBirdExplode();   // TODO
            } else if (command === Command.WIN) {
                setBubbleText("Perfektní!");
            } else if (command === Command.LOSE) {
                setBubbleText("Ale ne. Zkus to znovu!");
            } else if (command === Command.NOT_YET_THERE) {
                setBubbleText("Ještě tam nejsme. Zkus to znovu!");
            } else if (command === Command.INFINITE_LOOP) {
                setBubbleText("Program se zacyklil. Zkus to znovu!");
            }
        } else {
            clearInterval(visualReplayTimer);
            reset();
        }
    }
}

function isReady() {
    return visualBirdAnimationFrame === 0 && visualBirdAnimationTimer === null;
}

//-----------------------------------------------------------------------------

function showMove() {
    if (visualBirdOrientation === BirdOrientation.EAST) {
        visualBirdAnimationFrame = 0;
        visualBirdAnimationTimer = setInterval(animateMoveRight, 100);
    } else if (visualBirdOrientation === BirdOrientation.WEST) {
        visualBirdAnimationFrame = 0;
        visualBirdAnimationTimer = setInterval(animateMoveLeft, 100);
    } else if (visualBirdOrientation === BirdOrientation.NORTH) {
        visualBirdAnimationFrame = 0;
        visualBirdAnimationTimer = setInterval(animateMoveUp, 100);
    } else if (visualBirdOrientation === BirdOrientation.SOUTH) {
        visualBirdAnimationFrame = 0;
        visualBirdAnimationTimer = setInterval(animateMoveDown, 100);
    }
}

function showTurnLeft() {
    if (visualBirdOrientation === BirdOrientation.SOUTH) {
        birdElement.className = "red-right";
        visualBirdOrientation = BirdOrientation.EAST;
    } else if (visualBirdOrientation === BirdOrientation.NORTH) {
        birdElement.className = "red-left";
        visualBirdOrientation = BirdOrientation.WEST;
    } else if (visualBirdOrientation === BirdOrientation.EAST) {
        birdElement.className = "red-up";
        visualBirdOrientation = BirdOrientation.NORTH;
    } else if (visualBirdOrientation === BirdOrientation.WEST) {
        birdElement.className = "red-down";
        visualBirdOrientation = BirdOrientation.SOUTH;
    }
}

function showTurnRight() {
    if (visualBirdOrientation === BirdOrientation.NORTH) {
        birdElement.className = "red-right";
        visualBirdOrientation = BirdOrientation.EAST;
    } else if (visualBirdOrientation === BirdOrientation.SOUTH) {
        birdElement.className = "red-left";
        visualBirdOrientation = BirdOrientation.WEST;
    } else if (visualBirdOrientation === BirdOrientation.WEST) {
        birdElement.className = "red-up";
        visualBirdOrientation = BirdOrientation.NORTH;
    } else if (visualBirdOrientation === BirdOrientation.EAST) {
        birdElement.className = "red-down";
        visualBirdOrientation = BirdOrientation.SOUTH;
    }
}

function showPigExplode() {
    pigElement.className = "pig-explode";
    visualBirdAnimationFrame = 0;
    visualBirdAnimationTimer = setInterval(animateWin, 100);
}

//-----------------------------------------------------------------------------

function animateMoveRight() {
    visualBirdAnimationFrame++;
    if (visualBirdAnimationFrame === 1 || visualBirdAnimationFrame === 2) {
        birdElement.className = "red-right-move" + visualBirdAnimationFrame;
        birdElement.style.left = (visualBirdLeft - 4) + "px";
    } else if (visualBirdAnimationFrame >= 3 && visualBirdAnimationFrame <= 8) {
        birdElement.className = "red-right-move" + visualBirdAnimationFrame;
        birdElement.style.left = visualBirdLeft + (visualBirdAnimationFrame - 3) * 8 + "px";
    } else if (visualBirdAnimationFrame === 9) {
        birdElement.className = "red-right-move" + visualBirdAnimationFrame;
        birdElement.style.left = visualBirdLeft + (visualBirdAnimationFrame - 3) * 8 - 2 + "px";
    } else {
        birdElement.className = "red-right";
        visualBirdLeft = visualBirdLeft + 50;
        birdElement.style.left = visualBirdLeft + "px";
        clearInterval(visualBirdAnimationTimer);
        visualBirdAnimationTimer = null;
        visualBirdAnimationFrame = 0;
    }
}

function animateMoveLeft() {
    visualBirdAnimationFrame++;
    if (visualBirdAnimationFrame === 1 || visualBirdAnimationFrame === 2) {
        birdElement.className = "red-left-move" + visualBirdAnimationFrame;
        birdElement.style.left = (visualBirdLeft + 5) + "px";
    } else if (visualBirdAnimationFrame >= 3 && visualBirdAnimationFrame <= 8) {
        birdElement.className = "red-left-move" + visualBirdAnimationFrame;
        birdElement.style.left = (visualBirdLeft - (visualBirdAnimationFrame - 3) * 8) + "px";
    } else if (visualBirdAnimationFrame === 9) {
        birdElement.className = "red-left-move" + visualBirdAnimationFrame;
        birdElement.style.left = (visualBirdLeft - (visualBirdAnimationFrame - 3) * 8 + 2) + "px";
    } else {
        birdElement.className = "red-left";
        visualBirdLeft = visualBirdLeft - 50;
        birdElement.style.left = visualBirdLeft + "px";
        clearInterval(visualBirdAnimationTimer);
        visualBirdAnimationTimer = null;
        visualBirdAnimationFrame = 0;
    }
}

function animateMoveUp() {
    visualBirdAnimationFrame++;
    if (visualBirdAnimationFrame === 1 || visualBirdAnimationFrame === 2) {
        birdElement.className = "red-up-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop - 17) + "px";
    } else if (visualBirdAnimationFrame >= 3 && visualBirdAnimationFrame <= 8) {
        birdElement.className = "red-up-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop - (visualBirdAnimationFrame - 3) * 8 - 17) + "px";
    } else if (visualBirdAnimationFrame === 9) {
        birdElement.className = "red-up-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop - (visualBirdAnimationFrame - 3) * 8 + 2 - 17) + "px";
    } else {
        birdElement.className = "red-up";
        visualBirdTop = visualBirdTop - 50;
        birdElement.style.top = (visualBirdTop - 17) + "px";
        clearInterval(visualBirdAnimationTimer);
        visualBirdAnimationTimer = null;
        visualBirdAnimationFrame = 0;
    }
}

function animateMoveDown() {
    visualBirdAnimationFrame++;
    if (visualBirdAnimationFrame === 1 || visualBirdAnimationFrame === 2) {
        birdElement.className = "red-down-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop - 17) + "px";
    } else if (visualBirdAnimationFrame >= 3 && visualBirdAnimationFrame <= 8) {
        birdElement.className = "red-down-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop + (visualBirdAnimationFrame - 3) * 8 - 17) + "px";
    } else if (visualBirdAnimationFrame === 9) {
        birdElement.className = "red-down-move" + visualBirdAnimationFrame;
        birdElement.style.top = (visualBirdTop + (visualBirdAnimationFrame - 3) * 8 + 2 - 17) + "px";
    } else {
        birdElement.className = "red-down";
        visualBirdTop = visualBirdTop + 50;
        birdElement.style.top = (visualBirdTop - 17) + "px";
        clearInterval(visualBirdAnimationTimer);
        visualBirdAnimationTimer = null;
        visualBirdAnimationFrame = 0;
    }
}

function animateWin() {
    visualBirdAnimationFrame++;
    if (visualBirdAnimationFrame <= 9) {
        birdElement.className = "red-win" + visualBirdAnimationFrame;
    } else {
        birdElement.className = "red-win1";
        clearInterval(visualBirdAnimationTimer);
        visualBirdAnimationTimer = null;
        visualBirdAnimationFrame = 0;
    }
}

//-----------------------------------------------------------------------------
// Evaluate user program non-visually
//-----------------------------------------------------------------------------

function BirdLostException() {
}

function BirdWonException() {
}

function InfiniteLoopException() {
}

function isPathForward() {
    if (model.bird.direction === BirdOrientation.EAST && model.bird.x < 8 - 1) {
        if (model.cells[model.bird.y][model.bird.x + 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.NORTH && model.bird.y >= 1) {
        if (model.cells[model.bird.y - 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.WEST && model.bird.x >= 1) {
        if (model.cells[model.bird.y][model.bird.x - 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.SOUTH && model.bird.y < 8 - 1) {
        if (model.cells[model.bird.y + 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else {
        return false;
    }
}

function isTntForward() {
    if (model.bird.direction === BirdOrientation.EAST && model.bird.x < 8 - 1) {
        if (model.cells[model.bird.y][model.bird.x + 1] === Cell.TNT) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.NORTH && model.bird.y >= 1) {
        if (model.cells[model.bird.y - 1][model.bird.x] === Cell.TNT) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.WEST && model.bird.x >= 1) {
        if (model.cells[model.bird.y][model.bird.x - 1] === Cell.TNT) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.SOUTH && model.bird.y < 8 - 1) {
        if (model.cells[model.bird.y + 1][model.bird.x] === Cell.TNT) {
            return true;
        }
    } else {
        return false;
    }
}

function isPathLeft() {
    if (model.bird.direction === BirdOrientation.SOUTH && model.bird.x < 8 - 1) {
        if (model.cells[model.bird.y][model.bird.x + 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.EAST && model.bird.y >= 1) {
        if (model.cells[model.bird.y - 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.NORTH && model.bird.x >= 1) {
        if (model.cells[model.bird.y][model.bird.x - 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.WEST && model.bird.y < 8 - 1) {
        if (model.cells[model.bird.y + 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else {
        return false;
    }
}

function isPathRight() {
    if (model.bird.direction === BirdOrientation.NORTH && model.bird.x < 8 - 1) {
        if (model.cells[model.bird.y][model.bird.x + 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.WEST && model.bird.y >= 1) {
        if (model.cells[model.bird.y - 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.SOUTH && model.bird.x >= 1) {
        if (model.cells[model.bird.y][model.bird.x - 1] === Cell.EMPTY) {
            return true;
        }
    } else if (model.bird.direction === BirdOrientation.EAST && model.bird.y < 8 - 1) {
        if (model.cells[model.bird.y + 1][model.bird.x] === Cell.EMPTY) {
            return true;
        }
    } else {
        return false;
    }
}

function notFinished() {
    return !(model.bird.x === model.pig.x && model.bird.y === model.pig.y);
}

function moveForward() {
    if (arguments.length > 0) {
        alert("Příkaz moveForward() nesmí být volán s parametrem.\n\nToto je chybný zápis:\nmoveForward(" + arguments[0] + ");\n\nTakto by měl být správný zápis:\nmoveForward();\n\nPokud potřebujete udělat víc kroků, zkuste cyklus.");
    }
    if (isPathForward()) {
        if (model.bird.direction === BirdOrientation.EAST) {
            model.bird.x = model.bird.x + 1;
        } else if (model.bird.direction === BirdOrientation.NORTH) {
            model.bird.y = model.bird.y - 1;
        } else if (model.bird.direction === BirdOrientation.SOUTH) {
            model.bird.y = model.bird.y + 1;
        } else if (model.bird.direction === BirdOrientation.WEST) {
            model.bird.x = model.bird.x - 1;
        }
        replayCommandQueue.add(Command.MOVE_FORWARD);
        if (!notFinished()) {
            replayCommandQueue.add(Command.PIG_EXPLODE);
            throw new BirdWonException();
        }
    } else if (isTntForward()) {
        replayCommandQueue.add(Command.MOVE_FORWARD);
        replayCommandQueue.add(Command.BIRD_EXPLODE);
        throw new BirdLostException();
    } else {
        replayCommandQueue.add(Command.MOVE_FORWARD);
        throw new BirdLostException();
    }
}

function turnRight() {
    if (model.bird.direction === BirdOrientation.EAST) {
        model.bird.direction = BirdOrientation.SOUTH;
    } else if (model.bird.direction === BirdOrientation.NORTH) {
        model.bird.direction = BirdOrientation.EAST;
    } else if (model.bird.direction === BirdOrientation.SOUTH) {
        model.bird.direction = BirdOrientation.WEST;
    } else if (model.bird.direction === BirdOrientation.WEST) {
        model.bird.direction = BirdOrientation.NORTH;
    }
    replayCommandQueue.add(Command.TURN_RIGHT);
}

function turnLeft() {
    if (model.bird.direction === BirdOrientation.EAST) {
        model.bird.direction = BirdOrientation.NORTH;
    } else if (model.bird.direction === BirdOrientation.NORTH) {
        model.bird.direction = BirdOrientation.WEST;
    } else if (model.bird.direction === BirdOrientation.SOUTH) {
        model.bird.direction = BirdOrientation.EAST;
    } else if (model.bird.direction === BirdOrientation.WEST) {
        model.bird.direction = BirdOrientation.SOUTH;
    }
    replayCommandQueue.add(Command.TURN_LEFT);
}

//-----------------------------------------------------------------------------
// Public functionality
//-----------------------------------------------------------------------------

function setupLevel() {
    setupGameBoard();
    showGameboard();
    enablePlayButton();
}

function setGameBoardCells(cells) {
    model.cells = cells;
}

function setGameBoardChallengeText(text) {
    model.challenge = text;
}

function setGameBoardBirdPosition(x, y, orientation) {
    model.bird.x = x;
    model.bird.y = y;
    model.bird.direction = orientation;
}

function setGameBoardPigPosition(x, y) {
    model.pig.x = x;
    model.pig.y = y;
}

function setUserCodeName(fileName) {
    userCodeName = fileName;
}

function runLevel() {
    disablePlayButton();
    loadUserCode();
}

function loadUserCode() {
    var allScriptElements = document.querySelectorAll(".code-holder");
    console.log(allScriptElements.length);
    for (var i = 0; i < allScriptElements.length; i++) {
        var element = allScriptElements[i];
        element.parentNode.removeChild(element);
    }

    if (userCodeName !== undefined) {
        var headElement = document.getElementsByTagName("head")[0];
        var scriptElement = document.createElement("script");
        scriptElement.src = "../" + userCodeName + "?cacheBust=" + Math.round(Math.random() * 10000);
        scriptElement.className = "code-holder";
        scriptElement.onload = function () {
            executeLevel();
        }
        headElement.appendChild(scriptElement);
    }
}

function executeLevel() {
    try {
        priSpusteni();
        replayCommandQueue.add(Command.NOT_YET_THERE);
    } catch (ex) {
        if (ex instanceof BirdLostException) {
            replayCommandQueue.add(Command.LOSE);
        } else if (ex instanceof BirdWonException) {
            replayCommandQueue.add(Command.WIN);
        } else if (ex instanceof InfiniteLoopException) {
            replayCommandQueue.add(Command.INFINITE_LOOP);
        }
    }
    setupGameBoard();
    showReplay();
}

function reset() {
    resetPlayButton();
    // setupLevel();
}

function resetLevel() {
    setupLevel();
}

playButtonElement.addEventListener("click", runLevel);
resetButtonElement.addEventListener("click", resetLevel);
setupLevel();
