<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['contractor_id']);

$contractorId = (int) input('contractor_id');

$upd = $conn->prepare(
    'UPDATE contractor_notifications SET is_read = 1 WHERE contractor_id = ? AND is_read = 0'
);
$upd->bind_param('i', $contractorId);
$upd->execute();
$affected = $upd->affected_rows ?? 0;
$upd->close();

respond(true, 'Notifications marked as read', [
    'updated' => (int) $affected,
]);

