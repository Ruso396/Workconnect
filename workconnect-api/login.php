<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['phone', 'password', 'role']);

$phone = trim((string) input('phone'));
$password = trim((string) input('password'));
$role = trim((string) input('role'));

$stmt = $conn->prepare('SELECT id, name, phone, password, role, status, profile_image FROM users WHERE phone = ? LIMIT 1');
$stmt->bind_param('s', $phone);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password'])) {
    respond(false, 'Invalid phone or password', null, 401);
}

if ($user['role'] !== $role) {
    respond(false, 'Role mismatch for this account', null, 403);
}

$payload = fetch_user_profile_payload($conn, (int) $user['id']);
if ($payload === null) {
    respond(false, 'User not found', null, 404);
}

respond(true, 'Login successful', $payload);
