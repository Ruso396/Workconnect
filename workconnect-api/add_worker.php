<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['contractor_id', 'name', 'phone', 'password', 'role', 'location']);

$contractorId = (int) input('contractor_id');
$name = trim((string) input('name'));
$phone = trim((string) input('phone'));
$password = trim((string) input('password'));
$role = trim((string) input('role'));
$location = trim((string) input('location'));

$conn->begin_transaction();

try {
    // Create login user for worker
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $userRole = 'worker';
    $status = 'active';

    $userStmt = $conn->prepare(
        'INSERT INTO users (name, phone, password, role, status) VALUES (?, ?, ?, ?, ?)'
    );
    $userStmt->bind_param('sssss', $name, $phone, $hash, $userRole, $status);

    if (!$userStmt->execute()) {
        throw new RuntimeException('Unable to create worker user');
    }

    $userId = (int) $userStmt->insert_id;
    $userStmt->close();

// Normalize role and validate against contractor roles.
$roleKey = normalize_role_key($role);
if ($roleKey === '') {
    respond(false, 'Invalid worker role', null, 422);
}

ensure_default_contractor_roles($conn, $contractorId);

$roleCheck = $conn->prepare(
    'SELECT id FROM contractor_roles WHERE contractor_id = ? AND role_key = ? LIMIT 1'
);
$roleCheck->bind_param('is', $contractorId, $roleKey);
$roleCheck->execute();
$roleRow = $roleCheck->get_result()->fetch_assoc();
$roleCheck->close();

if (!$roleRow) {
    respond(false, 'Unknown worker role for this contractor', null, 422);
}

$role = $roleKey;

// Create worker profile row
    $workerStmt = $conn->prepare(
        'INSERT INTO workers (contractor_id, name, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $workerStmt->bind_param('isssss', $contractorId, $name, $phone, $hash, $role, $location);

    if (!$workerStmt->execute()) {
        throw new RuntimeException('Unable to add worker');
    }

    $workerId = (int) $workerStmt->insert_id;
    $workerStmt->close();

    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback();
    respond(false, $e->getMessage(), null, 500);
}

respond(true, 'Worker added successfully', [
    'id' => $workerId,
    'user_id' => $userId,
    'contractor_id' => $contractorId,
    'name' => $name,
    'phone' => $phone,
    'role' => $role,
    'status' => $status,
    'location' => $location,
]);

