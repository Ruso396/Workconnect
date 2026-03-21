<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['role_id', 'role_name']);

$roleId = (int) input('role_id');
$roleNameInput = (string) input('role_name');

$roleKey = normalize_role_key($roleNameInput);
$roleName = $roleKey;

if ($roleKey === '') {
    respond(false, 'Invalid role name', null, 422);
}

$get = $conn->prepare('SELECT contractor_id, role_key FROM contractor_roles WHERE id = ? LIMIT 1');
$get->bind_param('i', $roleId);
$get->execute();
$row = $get->get_result()->fetch_assoc();
$get->close();

if (!$row) {
    respond(false, 'Role not found', null, 404);
}

$contractorId = (int) $row['contractor_id'];
$oldRoleKey = (string) $row['role_key'];

// Prevent duplicates within the contractor.
$check = $conn->prepare(
    'SELECT id FROM contractor_roles WHERE contractor_id = ? AND role_key = ? AND id <> ? LIMIT 1'
);
$check->bind_param('isi', $contractorId, $roleKey, $roleId);
$check->execute();
$dup = $check->get_result()->fetch_assoc();
$check->close();

if ($dup) {
    respond(false, 'Role already exists', null, 409);
}

$upd = $conn->prepare('UPDATE contractor_roles SET role_key = ?, role_name = ? WHERE id = ?');
$upd->bind_param('ssi', $roleKey, $roleName, $roleId);

if (!$upd->execute()) {
    $upd->close();
    respond(false, 'Failed to update role', null, 500);
}
$upd->close();

// Keep existing workers consistent when renaming a role.
if ($oldRoleKey !== $roleKey) {
    $workersUpd = $conn->prepare('UPDATE workers SET role = ? WHERE contractor_id = ? AND role = ?');
    $workersUpd->bind_param('sis', $roleKey, $contractorId, $oldRoleKey);
    $workersUpd->execute();
    $workersUpd->close();
}

$stmt = $conn->prepare('SELECT id, role_key, role_name FROM contractor_roles WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $roleId);
$stmt->execute();
$out = $stmt->get_result()->fetch_assoc();
$stmt->close();

respond(true, 'Role updated', [
    'id' => (int) $out['id'],
    'role_key' => (string) $out['role_key'],
    'role_name' => (string) $out['role_name'],
]);

