<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

// Accept JSON/body fields: user_id (required), name (optional), phone (optional), password (optional), location (optional - worker only)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method', null, 405);
}

require_fields(['user_id']);

$userId = (int) input('user_id');
$name = input('name', null);
$phone = input('phone', null);
$password = input('password', null);
$location = input('location', null);

// Fetch existing user so we can keep `workers` table in sync for worker accounts.
// Workers' list uses the `workers` table for role/location, but it joins the `users` table via phone.
// If a worker changes phone, we must update the `workers.phone` value too.
$existingStmt = $conn->prepare('SELECT phone, role FROM users WHERE id = ? LIMIT 1');
$existingStmt->bind_param('i', $userId);
$existingStmt->execute();
$existing = $existingStmt->get_result()->fetch_assoc();
$existingStmt->close();

$existingPhone = $existing ? (string) $existing['phone'] : null;
$existingRole = $existing ? (string) $existing['role'] : null;

$fields = [];
$params = [];
$types = '';

if ($name !== null && trim((string) $name) !== '') {
    $fields[] = 'name = ?';
    $params[] = trim((string) $name);
    $types .= 's';
}

if ($phone !== null && trim((string) $phone) !== '') {
    $fields[] = 'phone = ?';
    $params[] = trim((string) $phone);
    $types .= 's';
}

if ($password !== null && trim((string) $password) !== '') {
    $hash = password_hash(trim((string) $password), PASSWORD_BCRYPT);
    $fields[] = 'password = ?';
    $params[] = $hash;
    $types .= 's';
}

// Worker location lives in `workers.location`.
$locationTrimmed = null;
if ($existingRole === 'worker' && $location !== null) {
    $maybe = trim((string) $location);
    $locationTrimmed = $maybe !== '' ? $maybe : null;
}

if (empty($fields) && $locationTrimmed === null) {
    respond(false, 'No fields to update', null, 422);
}

if (!empty($fields)) {
    $params[] = $userId;
    $types .= 'i';

    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
    $stmt = $conn->prepare($sql);

    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        $stmt->close();
        respond(false, 'Failed to update profile', null, 500);
    }

    $stmt->close();
}

// If updating a worker profile, mirror `name`/`phone` changes into the `workers` table.
// This ensures `get_workers.php` can always join and show the latest values.
if ($existingRole === 'worker' && $existingPhone !== null) {
    $workerFields = [];
    $workerParams = [];
    $workerTypes = '';

    if ($name !== null && trim((string) $name) !== '') {
        $workerFields[] = 'name = ?';
        $workerParams[] = trim((string) $name);
        $workerTypes .= 's';
    }

    if ($phone !== null && trim((string) $phone) !== '') {
        $workerFields[] = 'phone = ?';
        $workerParams[] = trim((string) $phone);
        $workerTypes .= 's';
    }

    if ($locationTrimmed !== null) {
        $workerFields[] = 'location = ?';
        $workerParams[] = $locationTrimmed;
        $workerTypes .= 's';
    }

    if (!empty($workerFields)) {
        $workerParams[] = $existingPhone; // WHERE phone = oldPhone
        $workerTypes .= 's';

        $workerSql = 'UPDATE workers SET ' . implode(', ', $workerFields) . ' WHERE phone = ?';
        $workerStmt = $conn->prepare($workerSql);
        $workerStmt->bind_param($workerTypes, ...$workerParams);
        $workerStmt->execute();
        $workerStmt->close();
    }
}

$payload = fetch_user_profile_payload($conn, $userId);
if ($payload === null) {
    respond(false, 'User not found', null, 404);
}

respond(true, 'Profile updated successfully', $payload);

