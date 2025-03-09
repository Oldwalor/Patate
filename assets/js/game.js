const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

const patateImg = new Image();
patateImg.src = "assets/img/patate.png";

let pseudo = "Guest";
let uid = "";
let pseudoSubmitted = false;

let patate = {
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

let ground = {
    x: 0,
    y: canvas.height - 20,
    width: canvas.width,
    height: 20,
    visible: true
};

let platforms = [];
let minSpacing = 60;
let maxSpacing = 110;
let lastY = canvas.height - 60;

let gamePaused = false;
let gameOver = false;
let score = 0;
let lastSubmittedScore = 0;
let leaderboardInterval = null;
let scoreSubmitInterval = null;

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
        minSpacing = 150;
        maxSpacing = 200;
        platforms.forEach(plat => {
            plat.y += 2;
        });
    }
}

function generatePlatforms() {
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

generatePlatforms();

let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", (event) => {
    if (gameOver) return;

    if (event.key === "ArrowLeft") moveLeft = true;
    if (event.key === "ArrowRight") moveRight = true;

    if (event.key === "a" || event.key === "A") moveLeft = true;
    if (event.key === "d" || event.key === "D") moveRight = true;

    if ((event.key === " " || event.key === "w" || event.key === "W") && patate.onGround) {
        patate.velocityY = patate.jumpPower;
        patate.onGround = false;
    }

    if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        togglePause();
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") moveLeft = false;
    if (event.key === "ArrowRight") moveRight = false;

    if (event.key === "a" || event.key === "A") moveLeft = false;
    if (event.key === "d" || event.key === "D") moveRight = false;
});

const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

const pauseMenu = document.getElementById("pauseMenu");

document.getElementById("continueButton").addEventListener("click", togglePause);
document.getElementById("restartFromPauseButton").addEventListener("click", restartGame);

document.getElementById("submitChangePseudo").addEventListener("click", createNewAccount);
document.getElementById("submitFetchUid").addEventListener("click", fetchAccount);
document.getElementById("skipPseudo").addEventListener("click", skipAccount);

function togglePause() {
    gamePaused = !gamePaused;

    if (gamePaused) {
        pauseMenu.style.display = "block";
        document.getElementById("pauseScore").textContent = score;
    } else {
        pauseMenu.style.display = "none";
        requestAnimationFrame(update);
    }
}

function showGameOverScreen() {
    gameOver = true;
    gameOverScreen.style.display = "block";
    finalScoreElement.textContent = score;
    
    if (uid) {
        submitScore();
    }
}

window.onload = () => {
    const storedUid = localStorage.getItem("uid");
    const storedPseudo = localStorage.getItem("pseudo");

    if (storedUid && storedPseudo) {
        uid = storedUid;
        pseudo = storedPseudo;
        pseudoSubmitted = true;
        updateProfileDisplay();
        fetchUserData();
        hidePseudoForm();
        startLeaderboardUpdates();
        if (uid) {
            startScoreSubmitInterval();
        }
    } else {
        showPseudoForm();
    }
};

function updateProfileDisplay() {
    document.getElementById("profilePseudo").textContent = pseudo || "Guest";
    document.getElementById("profileUid").textContent = uid || "N/A";
}

function createNewAccount() {
    const newPseudo = document.getElementById("changePseudo").value.trim();
    if (!newPseudo) {
        showStatusMessage("Please enter a valid username", "error");
        return;
    }

    fetch(`leaderboard/?create=${encodeURIComponent(newPseudo)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showStatusMessage(data.error, "error");
                return;
            }

            pseudo = data.pseudo;
            uid = data.uid;
            localStorage.setItem("pseudo", pseudo);
            localStorage.setItem("uid", uid);

            updateProfileDisplay();
            showStatusMessage("New account successfully created!", "success");
            startLeaderboardUpdates();
            startScoreSubmitInterval();
        })
        .catch(error => {
            showStatusMessage("Failed to conntect to server", "error");
            console.error("Error:", error);
        });
}

function fetchAccount() {
    const fetchUid = document.getElementById("fetchUid").value.trim();
    if (!fetchUid) {
        showStatusMessage("Please enter a valid UId", "error");
        return;
    }

    fetch(`leaderboard/?fetch=${encodeURIComponent(fetchUid)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showStatusMessage(data.error, "error");
                return;
            }

            pseudo = data.pseudo;
            uid = data.uid;
            localStorage.setItem("pseudo", pseudo);
            localStorage.setItem("uid", uid);

            document.getElementById("profileScore").textContent = data.score || 0;
            updateProfileDisplay();
            showStatusMessage("Account successfully fetched!", "success");
            startLeaderboardUpdates();
            startScoreSubmitInterval();
        })
        .catch(error => {
            showStatusMessage("Failed to connect to server", "error");
            console.error("Error:", error);
        });
}

function skipAccount() {
    pseudo = "Guest";
    uid = "";
    localStorage.removeItem("pseudo");
    localStorage.removeItem("uid");
    pseudoSubmitted = true;
    updateProfileDisplay();
    hidePseudoForm();
    startLeaderboardUpdates();
}

function showStatusMessage(message, type) {
    const statusElement = document.getElementById("profile-status");
    statusElement.textContent = message;
    statusElement.style.color = type === "error" ? "red" : "green";

    setTimeout(() => {
        statusElement.textContent = "";
    }, 5000);
}

function fetchUserData() {
    if (!uid) return;

    fetch(`leaderboard/?fetch=${encodeURIComponent(uid)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                document.getElementById("profileScore").textContent = data.score || 0;
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}

function startLeaderboardUpdates() {
    updateLeaderboard();

    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
    }

    leaderboardInterval = setInterval(() => {
        if (!gamePaused && !gameOver) {
            updateLeaderboard();
        }
    }, 10000);
}

function startScoreSubmitInterval() {
    if (scoreSubmitInterval) {
        clearInterval(scoreSubmitInterval);
    }

    scoreSubmitInterval = setInterval(() => {
        if (!gamePaused && !gameOver && score > lastSubmittedScore && uid) {
            submitScore();
        }
    }, 15000);
}

function restartGame() {
    document.location.reload();
}

restartButton.addEventListener("click", restartGame);

function update() {
    if (gameOver || gamePaused) return;

    adjustDifficulty();

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

    if (patate.y < canvas.height / 2) {
        platforms.forEach((plat) => {
            plat.y += Math.abs(patate.velocityY);
            if (plat.y > canvas.height) {
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
                    score += 5;
                } else {
                    score += 1;
                }
                plat.touched = true;
                document.getElementById("score").textContent = score;
            }

            patate.y = plat.y - patate.height;
            patate.velocityY = plat.type === "boost" ? patate.jumpPower * 1.5 : patate.jumpPower;

            if (!patate.firstPlatformTouched) {
                patate.firstPlatformTouched = true;
                ground.visible = false;
            }
        }
    });

    if (patate.y > canvas.height) {
        showGameOverScreen();
        return;
    }

    draw();
    requestAnimationFrame(update);
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

patateImg.onload = () => {
    update();
};

function showPseudoForm() {
    const pseudoForm = document.getElementById("pseudoForm");
    pseudoForm.style.display = "block";
}

function hidePseudoForm() {
    const pseudoForm = document.getElementById("pseudoForm");
    pseudoForm.style.display = "none";
}

document.getElementById("submitPseudo").addEventListener("click", () => {
    const newPseudo = document.getElementById("pseudo").value.trim();
    if (newPseudo) {
        fetch(`leaderboard/?create=${encodeURIComponent(newPseudo)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                pseudo = data.pseudo;
                uid = data.uid;
                localStorage.setItem("pseudo", pseudo);
                localStorage.setItem("uid", uid);

                pseudoSubmitted = true;
                hidePseudoForm();
                updateProfileDisplay();
                startLeaderboardUpdates();
                startScoreSubmitInterval();
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to create an account.");
            });
    }
});

function submitScore() {
    if (uid && score > 0) {
        const formData = new FormData();
        formData.append("uid", uid);
        formData.append("score", score);

        fetch("leaderboard/", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            lastSubmittedScore = score;
            updateLeaderboard();
            fetchUserData();
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }
}

function updateLeaderboard() {
    fetch("leaderboard/")
    .then(response => response.json())
    .then(data => {
        if (Array.isArray(data)) {
            const leaderboardList = document.getElementById("leaderboard-list");
            leaderboardList.innerHTML = "";

            const topFive = data.slice(0, 5);

            topFive.forEach((entry, index) => {
                const li = document.createElement("li");
                li.innerHTML = `<span>${index + 1}. ${entry.pseudo}</span><span>${entry.score}</span>`;

                if (entry.pseudo.includes(pseudo)) {
                    li.style.backgroundColor = "rgba(255, 215, 0, 0.5)";
                    li.style.fontWeight = "bold";
                }

                leaderboardList.appendChild(li);
            });
        }
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });
}