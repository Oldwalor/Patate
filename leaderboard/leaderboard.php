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
leaderboard.php
-
Leaderboard API
*/




require_once("utils.php");

function getTopTenScores($conn) {
    $stmt = $conn->prepare("SELECT pseudo, uid, score FROM leaderboard WHERE flagged = FALSE ORDER BY score DESC LIMIT 10");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $scores = [];
    while ($row = $result->fetch_assoc()) {
        $pseudoWithUid = formatPseudoWithUid($row['pseudo'], $row['uid']);
        $scores[] = ["pseudo" => $pseudoWithUid, "score" => intval($row['score'])];
    }
    $stmt->close();
    
    return $scores;
}

try {
    $scores = getTopTenScores($conn);
    respondWithData($scores);
} catch (Exception $e) {
    respondWithError("Server error: " . $e->getMessage());
}
?>
