/*

'||''|.   ..|''||   |''||''|     |     |''||''|  ..|''||   
 ||   || .|'    ||     ||       |||       ||    .|'    ||  
 ||...|' ||      ||    ||      |  ||      ||    ||      || 
 ||      '|.     ||    ||     .''''|.     ||    '|.     || 
.||.      ''|...|'    .||.   .|.  .||.   .||.    ''|...|'  
                                                           
                                                           
POTATO.THESERVER.LIFE
LICENSE GPL-3.0

-------------------------------
gameCore.js
-
Game core file
*/



import { submitScore } from './leaderboard.js';

let canvas;
let ctx;
let animationFrameId;

let gamePaused = false;
let gameOver = false;
let score = 0;

let patate;
let patateImg;

let ground;
let platforms = [];
let minSpacing = 60;
let maxSpacing = 110;
let lastY;

let moveLeft = false;
let moveRight = false;
let controlsActive = false;


export function initGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = 400;
    canvas.height = 600;

    patateImg = new Image();
    patateImg.src = "assets/img/potato.png";

    patate = {
        x: canvas.width / 2 - 20,
        y: canvas.height - 60,
        width: 40,
        height: 40,
        velocityX: 0,
        velocityY: 0,
        gravity: 0.3,
        baseGravity: 0.3,
        jumpPower: -9,
        baseJumpPower: -9,
        onGround: true,
        firstPlatformTouched: false
    };

    ground = {
        x: 0,
        y: canvas.height - 20,
        width: canvas.width,
        height: 20,
        visible: true
    };

    generatePlatforms();

    initControls();
}



export function startGame() {
    if (!window.pseudoSubmitted) return;
    
    gameOver = false;
    gamePaused = false;
    score = 0;
    window.score = 0;
    window.gameOver = false;
    window.gamePaused = false;
    
    controlsActive = true;
    
    document.getElementById("score").textContent = "0";
    update();
}

export function restartGame() {
    document.location.reload();
}

export function togglePause() {
    gamePaused = !gamePaused;
    window.gamePaused = gamePaused;

    const pauseMenu = document.getElementById("pauseMenu");
    if (gamePaused) {
        pauseMenu.style.display = "block";
        document.getElementById("pauseScore").textContent = score;
    } else {
        pauseMenu.style.display = "none";
        requestAnimationFrame(update);
    }
}

function update() {
    if (gameOver || gamePaused) return;

    adjustDifficulty();

    updatePatate();
    
    const collisionResult = updatePlatforms();
    if (collisionResult.scoreChanged) {
        score += collisionResult.scoreIncrement;
        window.score = score;
        document.getElementById("score").textContent = score;
    }

    if (patate.y > canvas.height) {
        gameOver = true;
        window.gameOver = true;
        showGameOverScreen();
        return;
    }

    draw();
    
    animationFrameId = requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (ground.visible) {
        ctx.fillStyle = "brown";
        ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
    }
    
    platforms.forEach((plat) => {
        ctx.fillStyle = plat.type === "boost" ? "red" : "green";
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    });
    
    ctx.drawImage(patateImg, patate.x, patate.y, patate.width, patate.height);
}


function updatePatate() {
    patate.velocityY += patate.gravity;
    patate.y += patate.velocityY;

    if (moveLeft) patate.velocityX = -3;
    else if (moveRight) patate.velocityX = 3;
    else patate.velocityX = 0;

    patate.x += patate.velocityX;

    if (ground.visible && patate.y + patate.height >= ground.y) {
        patate.y = ground.y - patate.height;
        patate.velocityY = 0;
        patate.onGround = true;
    }

    if (patate.x + patate.width < 0) patate.x = canvas.width;
    else if (patate.x > canvas.width) patate.x = -patate.width;
}

function jump() {
    if (patate.onGround) {
        patate.velocityY = patate.jumpPower;
        patate.onGround = false;
    }
}

function generatePlatforms() {
    platforms = [];
    
    const maxJumpHeight = Math.abs(patate.jumpPower * patate.jumpPower / (2 * patate.gravity));

    const firstPlatformY = ground.y - (maxJumpHeight * 0.8);

    platforms.push({
        x: Math.random() * (canvas.width - 80),
        y: firstPlatformY,
        width: 80,
        height: 10,
        type: "normal",
        touched: false
    });

    lastY = firstPlatformY;

    for (let i = 0; i < 19; i++) {
        let spacing = Math.random() * (maxSpacing - minSpacing) + minSpacing;
        lastY -= spacing;

        platforms.push({
            x: Math.random() * (canvas.width - 80),
            y: lastY,
            width: 80,
            height: 10,
            type: Math.random() > 0.8 ? "boost" : "normal",
            touched: false
        });
    }
}

function updatePlatforms() {
    let scoreChanged = false;
    let scoreIncrement = 0;

    if (patate.y < canvas.height / 2) {
        platforms.forEach((plat) => {
            plat.y += Math.abs(patate.velocityY);
            if (plat.y > canvas.height) {
                regeneratePlatform(plat);
            }
        });
    }

    platforms.forEach((plat) => {
        if (
            patate.velocityY > 0 &&
            patate.y + patate.height > plat.y &&
            patate.y + patate.height - patate.velocityY <= plat.y &&
            patate.x + patate.width > plat.x &&
            patate.x < plat.x + plat.width
        ) {
            if (!plat.touched) {
                if (plat.type === "boost") {
                    scoreIncrement = 5;
                } else {
                    scoreIncrement = 1;
                }
                scoreChanged = true;
                plat.touched = true;
            }

            patate.y = plat.y - patate.height;
            patate.velocityY = plat.type === "boost" ? patate.jumpPower * 1.5 : patate.jumpPower;

            if (!patate.firstPlatformTouched) {
                patate.firstPlatformTouched = true;
                ground.visible = false;
            }
        }
    });

    return { scoreChanged, scoreIncrement };
}

function regeneratePlatform(plat) {
    plat.y = -10;
    plat.x = Math.random() * (canvas.width - 80);
    plat.type = Math.random() > 0.8 ? "boost" : "normal";
    plat.touched = false;
    
    let lastPlatform = platforms.reduce((a, b) => (a.y < b.y ? a : b));

    let newY = lastPlatform.y - (minSpacing + Math.random() * (maxSpacing - minSpacing));

    if (plat.type === "boost") {
        newY -= 30;
    }

    plat.y = newY;

    if (plat.type === "boost") {
        let safePlatform = {
            x: Math.random() * (canvas.width - 80),
            y: plat.y + 40,
            width: 80,
            height: 10,
            type: "normal",
            touched: false
        };
        platforms.push(safePlatform);
    }
}

function initControls() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    
    document.addEventListener("focusin", function(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            controlsActive = false;
        }
    });
    
    document.addEventListener("focusout", function(e) {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            controlsActive = true;
        }
    });
    
    document.getElementById("continueButton").addEventListener("click", togglePause);
    document.getElementById("restartFromPauseButton").addEventListener("click", restartGame);
    document.getElementById("restartButton").addEventListener("click", restartGame);
}

function handleKeyDown(event) {
    if (!controlsActive) return;
    
    if (gameOver) return;

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        moveLeft = true;
        event.preventDefault();
    }
    
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        moveRight = true;
        event.preventDefault();
    }

    if ((event.key === " " || event.key === "w" || event.key === "W")) {
        jump();
        event.preventDefault();
    }

    if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        togglePause();
        event.preventDefault();
    }
}

function handleKeyUp(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        moveLeft = false;
    }
    
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        moveRight = false;
    }
}

function adjustDifficulty() {
    if (score > 50) {
        minSpacing = 100;
        maxSpacing = 150;

        if (score <= 100) {
            patate.gravity = patate.baseGravity * 0.8;
            patate.jumpPower = patate.baseJumpPower * 1.15;
        } else {
            patate.gravity = patate.baseGravity;
            patate.jumpPower = patate.baseJumpPower;
        }
    }

    if (score > 100 && score <= 200) {
        platforms.forEach(plat => {
            plat.type = "boost";
        });
    }

    if (score > 200) {
        minSpacing = 120;
        maxSpacing = 150;
        platforms.forEach(plat => {
            plat.y += 2;
        });
    }
}

function showGameOverScreen() {
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScoreElement = document.getElementById("finalScore");
    
    gameOverScreen.style.display = "block";
    finalScoreElement.textContent = score;
    
    if (window.uid) {
        submitScore(window.uid, score, true);
    }
}

export {
    score,
    gameOver,
    gamePaused,
    showGameOverScreen
};

export function setControlsActive(active) {
    controlsActive = active;
}
