<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['worker_id', 'status']);

$workerId = (int) input('worker_id');
$status = trim((string) input('status'));

if (!in_array($status, ['active', 'inactive'], true)) {
    respond(false, 'Invalid status', null, 422);
}

$stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ? AND role = 'worker'");
$stmt->bind_param('si', $status, $workerId);

if (!$stmt->execute()) {
    respond(false, 'Unable to update status', null, 500);
}

$stmt->close();
respond(true, 'Status updated', [
    'worker_id' => $workerId,
    'status' => $status,
]);
