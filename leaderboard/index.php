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
index.php
-
API entry file
*/




require_once("config.php");
require_once("database.php");
require_once("utils.php");
require_once("cors.php");

setupCors();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

initializeDatabase($conn);

if (isset($_GET['drop']) && $_GET['drop'] === $resetPassword) {
    require_once("adminInterface.php");
    exit;
}

if (isset($_GET['executeDropTable'])) {
    require_once("adminActions.php");
    exit;
}

if (isset($_GET['flagAccount'])) {
    require_once("adminActions.php");
    exit;
}

if (isset($_GET['create'])) {
    require_once("userCreate.php");
    exit;
}

if (isset($_GET['fetch'])) {
    require_once("userFetch.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once("scoreUpdate.php");
}

require_once("leaderboard.php");

$conn->close();
?>
