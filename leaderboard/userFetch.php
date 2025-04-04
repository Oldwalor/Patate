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
userFetch.php
-
User managment
*/




require_once("utils.php");


function getUserByUid($conn, $uid) {
    $stmt = $conn->prepare("SELECT pseudo, score, games_played FROM leaderboard WHERE uid = ?");
    $stmt->bind_param("s", $uid);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    if ($user) {
        return [
            "uid" => $uid,
            "pseudo" => $user['pseudo'],
            "score" => intval($user['score']),
            "games_played" => $user['games_played']
        ];
    }
    
    return null;
}

try {
    if (empty($_GET['fetch'])) {
        respondWithError("UID is required for fetching");
        exit;
    }

    $fetchUid = trim($_GET['fetch']);
    $user = getUserByUid($conn, $fetchUid);

    if ($user) {
        respondWithData($user);
    } else {
        respondWithError("User not found");
    }
} catch (Exception $e) {
    respondWithError("Server error: " . $e->getMessage());
}
?>
