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
Leaderboard manager
*/



let leaderboardInterval = null;
let scoreSubmitInterval = null;

export function submitScore(uid, score, gameEnd = false) {
    if (uid && score > 0) {
        const formData = new FormData();
        formData.append("uid", uid);
        formData.append("score", score);
        formData.append("gameEnd", gameEnd);

        fetch("leaderboard/", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            window.lastSubmittedScore = score;
            updateLeaderboard();
            fetchUserData();
        })
        .catch(error => {
            console.error("Error:", error);
        });
    }
}

export function updateLeaderboard() {
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

                if (entry.pseudo.includes(window.pseudo)) {
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

export function fetchUserData() {
    if (!window.uid) return;

    fetch(`leaderboard/?fetch=${encodeURIComponent(window.uid)}`)
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                document.getElementById("profileScore").textContent = data.score || 0;
                document.getElementById("gamesPlayed").textContent = data.games_played || 0;
                
                if (data.flagged === 1) {
                    import('./ui.js').then(ui => {
                        ui.showWarningBanner();
                    });
                }
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
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
    }, 10000);
}
