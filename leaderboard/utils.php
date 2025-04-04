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
utils.php
-
Different utilities
*/

function respondWithError($message) {
    echo json_encode(["error" => $message], JSON_PRETTY_PRINT);
}

function respondWithData($data) {
    echo json_encode($data, JSON_PRETTY_PRINT);
}

function respondWithSuccess($additionalData = []) {
    $response = ["success" => true];
    if (!empty($additionalData)) {
        $response = array_merge($response, $additionalData);
    }
    echo json_encode($response, JSON_PRETTY_PRINT);
}

function getPostData() {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        $input = $_POST;
    }
    return $input;
}

function formatPseudoWithUid($pseudo, $uid) {
    return $pseudo . ' [' . substr($uid, 0, 2) . substr($uid, -2) . ']';
}
