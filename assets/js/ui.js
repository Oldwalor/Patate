/*

'||''|.   ..|''||   |''||''|     |     |''||''|  ..|''||   
 ||   || .|'    ||     ||       |||       ||    .|'    ||  
 ||...|' ||      ||    ||      |  ||      ||    ||      || 
 ||      '|.     ||    ||     .''''|.     ||    '|.     || 
.||.      ''|...|'    .||.   .|.  .||.   .||.    ''|...|'  
                                                           
                                                           
POTATO.THESERVER.LIFE
LICENSE GPL-3.0

-------------------------------
leaderboard.js
-
UI Builder
*/




import { submitScore, updateLeaderboard, fetchUserData } from './leaderboard.js';

let leaderboardInterval = null;
let scoreSubmitInterval = null;

export function initUI() {
    const gameOverScreen = document.getElementById("gameOverScreen");
    const pauseMenu = document.getElementById("pauseMenu");
    
    gameOverScreen.style.display = "none";
    pauseMenu.style.display = "none";
}


export function updateProfileDisplay() {
    document.getElementById("profilePseudo").textContent = window.pseudo || "Guest";
    document.getElementById("profileUid").textContent = window.uid || "N/A";
}

export function createNewAccount() {
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

            window.pseudo = data.pseudo;
            window.uid = data.uid;
            localStorage.setItem("pseudo", window.pseudo);
            localStorage.setItem("uid", window.uid);

            updateProfileDisplay();
            showStatusMessage("New account successfully created!", "success");
            startLeaderboardUpdates();
            startScoreSubmitInterval();
        })
        .catch(error => {
            showStatusMessage("Failed to connect to server", "error");
            console.error("Error:", error);
        });
}

export function fetchAccount() {
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

            window.pseudo = data.pseudo;
            window.uid = data.uid;
            localStorage.setItem("pseudo", window.pseudo);
            localStorage.setItem("uid", window.uid);

            document.getElementById("profileScore").textContent = data.score || 0;
            document.getElementById("gamesPlayed").textContent = data.games_played || 0;
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

export function skipAccount() {
    window.pseudo = "Guest";
    window.uid = "";
    localStorage.removeItem("pseudo");
    localStorage.removeItem("uid");
    window.pseudoSubmitted = true;
    updateProfileDisplay();
    hidePseudoForm();
    startLeaderboardUpdates();
}

export function showStatusMessage(message, type) {
    const statusElement = document.getElementById("profile-status");
    statusElement.textContent = message;
    statusElement.style.color = type === "error" ? "red" : "green";

    setTimeout(() => {
        statusElement.textContent = "";
    }, 5000);
}

export function showPseudoForm() {
    const pseudoForm = document.getElementById("pseudoForm");
    pseudoForm.style.display = "block";
}

export function hidePseudoForm() {
    const pseudoForm = document.getElementById("pseudoForm");
    pseudoForm.style.display = "none";
}

export function startLeaderboardUpdates() {
    updateLeaderboard();

    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
    }

    leaderboardInterval = setInterval(() => {
        if (!window.gamePaused && !window.gameOver) {
            updateLeaderboard();
        }
    }, 10000);
}

export function startScoreSubmitInterval() {
    if (scoreSubmitInterval) {
        clearInterval(scoreSubmitInterval);
    }

    scoreSubmitInterval = setInterval(() => {
        if (!window.gamePaused && !window.gameOver && window.score > window.lastSubmittedScore && window.uid) {
            submitScore(window.uid, window.score);
        }
    }, 15000);
}
