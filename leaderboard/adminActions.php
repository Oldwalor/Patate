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
adminActions.php
-
Admin utilities
*/

require_once("config.php");
require_once("database.php");
require_once("utils.php");

try {
    if (isset($_GET['flagAccount'], $_GET['pass']) && $_GET['pass'] === $resetPassword) {
        $uid = $_GET['flagAccount'];

        $stmt = $conn->prepare("SELECT flagged FROM leaderboard WHERE uid = ?");
        $stmt->bind_param("s", $uid);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $currentFlag = $row['flagged'];
            $newFlag = !$currentFlag;

            $stmt->close();

            $update = $conn->prepare("UPDATE leaderboard SET flagged = ? WHERE uid = ?");
            $update->bind_param("is", $newFlag, $uid);
            $success = $update->execute();
            $update->close();

            if ($success) {
                respondWithSuccess(["uid" => $uid, "new_flagged" => $newFlag]);
            } else {
                respondWithError("Failed to update flagged status.");
            }
        } else {
            respondWithError("No user found with this UID.");
        }

    } elseif (isset($_GET['executeDropTable']) && $_GET['executeDropTable'] === $resetPassword) {
        $result = dropLeaderboardTable($conn);

        if ($result) {
            respondWithSuccess();
        } else {
            respondWithError("Failed to drop leaderboard table.");
        }

    } else {
        require_once("leaderboard.php");
    }

} catch (Exception $e) {
    respondWithError("Server error: " . $e->getMessage());
}
