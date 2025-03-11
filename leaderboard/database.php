<?php
/*

'||''|.   ..|''||   |''||''|     |     |''||''|  ..|''||   
 ||   || .|'    ||     ||       |||       ||    .|'    ||  
 ||...|' ||      ||    ||      |  ||      ||    ||      || 
 ||      '|.     ||    ||     .''''|.     ||    '|.     || 
.||.      ''|...|'    .||.   .|.  .||.   .||.    ''|...|'  
                                                           
                                                           
POTATO.THESERVER.LIFE
LICENSE GPL-3.0

-------------------------------
database.php
-
Mysqli database manager
*/




require_once("secrets.php");
require_once("utils.php");

$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    respondWithError("Connexion échouée : " . $conn->connect_error);
    exit;
}


function initializeDatabase($conn) {
    $createTableQuery = "
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(255) NOT NULL UNIQUE,
            pseudo VARCHAR(255) NOT NULL,
            score INT NOT NULL
        )
    ";
    $conn->query($createTableQuery);
}


function dropLeaderboardTable($conn) {
    $dropQuery = "DROP TABLE IF EXISTS leaderboard";
    return $conn->query($dropQuery);
}
?>