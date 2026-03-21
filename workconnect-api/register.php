<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['name', 'phone', 'password', 'role']);

$name = trim((string) input('name'));
$phone = trim((string) input('phone'));
$password = trim((string) input('password'));
$role = trim((string) input('role'));

if (!in_array($role, ['worker', 'contractor'], true)) {
    respond(false, 'Invalid role', null, 422);
}

$check = $conn->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
$check->bind_param('s', $phone);
$check->execute();
$exists = $check->get_result()->fetch_assoc();
$check->close();

if ($exists) {
    respond(false, 'Phone already registered', null, 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$defaultStatus = 'active';
$stmt = $conn->prepare('INSERT INTO users (name, phone, password, role, status) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $name, $phone, $hash, $role, $defaultStatus);

if (!$stmt->execute()) {
    respond(false, 'Unable to register user', null, 500);
}

$id = $stmt->insert_id;
$stmt->close();

respond(true, 'Registration successful', [
    'id' => (int) $id,
    'name' => $name,
    'phone' => $phone,
    'role' => $role,
    'status' => $defaultStatus,
]);
