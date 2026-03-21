<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['role_id']);

$roleId = (int) input('role_id');

$get = $conn->prepare('SELECT contractor_id, role_key FROM contractor_roles WHERE id = ? LIMIT 1');
$get->bind_param('i', $roleId);
$get->execute();
$row = $get->get_result()->fetch_assoc();
$get->close();

if (!$row) {
    respond(false, 'Role not found', null, 404);
}

$contractorId = (int) $row['contractor_id'];
$roleKey = (string) $row['role_key'];

// Prevent deleting roles that are currently used by workers (keeps role filter/send-job consistent).
$checkWorkers = $conn->prepare('SELECT COUNT(*) AS cnt FROM workers WHERE contractor_id = ? AND role = ?');
$checkWorkers->bind_param('is', $contractorId, $roleKey);
$checkWorkers->execute();
$cnt = (int) ($checkWorkers->get_result()->fetch_assoc()['cnt'] ?? 0);
$checkWorkers->close();

if ($cnt > 0) {
    respond(false, 'Cannot delete role that is used by existing workers', null, 409);
}

$del = $conn->prepare('DELETE FROM contractor_roles WHERE id = ?');
$del->bind_param('i', $roleId);

if (!$del->execute()) {
    $del->close();
    respond(false, 'Failed to delete role', null, 500);
}

$del->close();

respond(true, 'Role deleted', [
    'deleted' => true,
]);

