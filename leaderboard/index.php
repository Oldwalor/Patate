<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$reset_pwd = "adminpass123"; #Password for dropping lb tbl


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once("database.php");

if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

$createTableQuery = "
    CREATE TABLE IF NOT EXISTS leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) NOT NULL UNIQUE,
        pseudo VARCHAR(255) NOT NULL,
        score INT NOT NULL
    )
";
$conn->query($createTableQuery);


if (isset($_GET['drop']) && $_GET['drop'] === $reset_pwd) {
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Bye Bye LB</title>
        <style>
            #dropButton {
                position: absolute;
            }
        </style>
    </head>
    <body>
        <button id="dropButton">Drop</button>
        <script>
            const button = document.getElementById("dropButton");
            let clickCount = 0;
            const password = "' . $reset_pwd . '";

            function repositionButton() {
                const maxWidth = window.innerWidth - 100;
                const maxHeight = window.innerHeight - 50;
                
                const randomX = Math.floor(Math.random() * maxWidth);
                const randomY = Math.floor(Math.random() * maxHeight);
                
                button.style.left = randomX + "px";
                button.style.top = randomY + "px";
            }

            function updateButtonColor() {
                const colorIntensity = Math.floor((clickCount / 10) * 255);
                button.style.backgroundColor = `rgb(255, ${255 - colorIntensity}, ${255 - colorIntensity})`;
            }

            repositionButton();
            
            button.addEventListener("click", function() {
                clickCount++;
                updateButtonColor();
                
                if (clickCount < 10) {
                    repositionButton();
                } else {
                    fetch(window.location.pathname + "?executeDropTable=" + password)
                    .then(response => response.json())
                    .then(data => {
                        button.disabled = true;
                        if (data.success) {
                            alert("Yay! Table has gone boom");
                        } else {
                            alert("Error: " + (data.error || "Idk men"));
                        }
                    })
                    .catch(error => {
                        alert("Error");
                    });
                }
            });
        </script>
    </body>
    </html>';
    exit;
}

if (isset($_GET['executeDropTable'])) {
    if ($_GET['executeDropTable'] === $reset_pwd) {
        try {
            $dropQuery = "DROP TABLE IF EXISTS leaderboard";
            $result = $conn->query($dropQuery);
            
            if ($result) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "Échec de la suppression de la table"]);
            }
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
    } else {
        try {
            $result = $conn->query("SELECT pseudo, uid, score FROM leaderboard ORDER BY score DESC LIMIT 10");
            $scores = [];
            while ($row = $result->fetch_assoc()) {
                $pseudoWithUid = $row['pseudo'] . ' [' . substr($row['uid'], 0, 2) . substr($row['uid'], -2) . ']';
                $scores[] = ["pseudo" => $pseudoWithUid, "score" => $row['score']];
            }
            echo json_encode($scores);
        } catch (Exception $e) {
            echo json_encode(["error" => "Server error: " . $e->getMessage()]);
        }
    }
    exit;
}

try {
    if (isset($_GET['create'])) {
        if (empty($_GET['create'])) {
            echo json_encode(["error" => "Pseudo is required for creation"]);
            exit;
        }

        $pseudo = $_GET['create'];
        $uid = uniqid();
        $initial_score = 0;

        $stmt = $conn->prepare("INSERT INTO leaderboard (uid, pseudo, score) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $uid, $pseudo, $initial_score);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["pseudo" => $pseudo, "uid" => $uid]);
        exit;
    }

    if (isset($_GET['fetch'])) {
        if (empty($_GET['fetch'])) {
            echo json_encode(["error" => "UID is required for fetching"]);
            exit;
        }

        $fetch_uid = $_GET['fetch'];

        $stmt = $conn->prepare("SELECT pseudo, score FROM leaderboard WHERE uid = ?");
        $stmt->bind_param("s", $fetch_uid);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            echo json_encode(["uid" => $fetch_uid, "pseudo" => $row['pseudo'], "score" => $row['score']]);
        } else {
            echo json_encode(["error" => "User not found"]);
        }

        $stmt->close();
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $uid = $_POST['uid'] ?? "";
        $score = intval($_POST['score'] ?? 0);

        if (empty($uid) || !is_numeric($score)) {
            echo json_encode(["error" => "UID and score are required for updating"]);
            exit;
        }

        $stmt = $conn->prepare("SELECT score FROM leaderboard WHERE uid = ?");
        $stmt->bind_param("s", $uid);
        $stmt->execute();
        $stmt->store_result();
        $stmt->bind_result($existingScore);
        $stmt->fetch();
        $stmt->close();

        if ($existingScore !== null) {
            if ($score > $existingScore) {
                $stmt = $conn->prepare("UPDATE leaderboard SET score = ? WHERE uid = ?");
                $stmt->bind_param("is", $score, $uid);
                $stmt->execute();
                $stmt->close();
            }
        } else {
            $pseudoDefault = "Unknown";
            $stmt = $conn->prepare("INSERT INTO leaderboard (uid, pseudo, score) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $uid, $pseudoDefault, $score);
            $stmt->execute();
            $stmt->close();
        }
    }

    $result = $conn->query("SELECT pseudo, uid, score FROM leaderboard ORDER BY score DESC LIMIT 10");
    $scores = [];
    while ($row = $result->fetch_assoc()) {
        $pseudoWithUid = $row['pseudo'] . ' [' . substr($row['uid'], 0, 2) . substr($row['uid'], -2) . ']';
        $scores[] = ["pseudo" => $pseudoWithUid, "score" => $row['score']];
    }
    echo json_encode($scores);
} catch (Exception $e) {
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}

$conn->close();
?>