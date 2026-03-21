<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['request_id', 'status']);

$requestId = (int) input('request_id');
$status = trim((string) input('status'));

if (!in_array($status, ['accepted', 'rejected'], true)) {
    respond(false, 'Invalid request status', null, 422);
}

$stmt = $conn->prepare("UPDATE job_requests SET status = ? WHERE id = ? AND status = 'pending'");
$stmt->bind_param('si', $status, $requestId);

if (!$stmt->execute()) {
    respond(false, 'Failed to update job request', null, 500);
}

$wasUpdated = (int) ($stmt->affected_rows ?? 0) > 0;
$stmt->close();

// On worker response, create a contractor notification (idempotent due to unique(request_id)).
if ($wasUpdated && ($status === 'accepted' || $status === 'rejected')) {
    $payloadStmt = $conn->prepare(
        "SELECT
            jr.id AS request_id,
            j.contractor_id,
            jr.worker_id,
            u.name AS worker_name,
            j.title AS job_title,
            j.location AS job_location,
            jr.job_id
         FROM job_requests jr
         INNER JOIN jobs j ON j.id = jr.job_id
         INNER JOIN users u ON u.id = jr.worker_id
         WHERE jr.id = ?
         LIMIT 1"
    );
    $payloadStmt->bind_param('i', $requestId);
    $payloadStmt->execute();
    $row = $payloadStmt->get_result()->fetch_assoc();
    $payloadStmt->close();

    if ($row) {
        $notif = $conn->prepare(
            "INSERT IGNORE INTO contractor_notifications
             (contractor_id, worker_id, job_id, request_id, action, worker_name, job_title, job_location, is_read)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)"
        );
        $action = $status;
        $notif->bind_param(
            'iiisssss',
            $row['contractor_id'],
            $row['worker_id'],
            $row['job_id'],
            $row['request_id'],
            $action,
            $row['worker_name'],
            $row['job_title'],
            $row['job_location']
        );
        $notif->execute();
        $notif->close();
    }
}

respond(true, 'Job request updated', [
    'request_id' => $requestId,
    'status' => $status,
]);
