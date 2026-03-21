<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id']);

$contractorId = (int) input('contractor_id');

$stmt = $conn->prepare('DELETE FROM contractor_notifications WHERE contractor_id = ?');
$stmt->bind_param('i', $contractorId);

if (!$stmt->execute()) {
    respond(false, 'Failed to delete notifications', null, 500);
}

$deleted = (int) ($stmt->affected_rows ?? 0);
$stmt->close();

respond(true, 'All notifications deleted', [
    'deleted_count' => $deleted,
]);
