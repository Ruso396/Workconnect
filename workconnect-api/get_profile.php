<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

// Accept: user_id (required)

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method', null, 405);
}

require_fields(['user_id']);

$userId = (int) input('user_id');

$user = fetch_user_profile_payload($conn, $userId);

if (!$user) {
    respond(false, 'User not found', null, 404);
}

respond(true, 'Profile fetched', $user);
