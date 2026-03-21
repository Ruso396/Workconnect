<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['contractor_id', 'role_name']);

$contractorId = (int) input('contractor_id');
$roleNameInput = (string) input('role_name');

$roleKey = normalize_role_key($roleNameInput);
$roleName = $roleKey;

if ($roleKey === '') {
    respond(false, 'Invalid role name', null, 422);
}

// Prevent duplicates per contractor.
$ins = $conn->prepare(
    'INSERT IGNORE INTO contractor_roles (contractor_id, role_key, role_name) VALUES (?, ?, ?)'
);
$ins->bind_param('iss', $contractorId, $roleKey, $roleName);
$ins->execute();
$ins->close();

// Return the existing or newly created role.
$stmt = $conn->prepare(
    'SELECT id, role_key, role_name FROM contractor_roles WHERE contractor_id = ? AND role_key = ? LIMIT 1'
);
$stmt->bind_param('is', $contractorId, $roleKey);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    respond(false, 'Failed to add role', null, 500);
}

respond(true, 'Role saved', [
    'id' => (int) $row['id'],
    'role_key' => (string) $row['role_key'],
    'role_name' => (string) $row['role_name'],
]);

