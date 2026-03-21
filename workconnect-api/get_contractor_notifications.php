<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id']);

$contractorId = (int) input('contractor_id');

$stmt = $conn->prepare(
    'SELECT
        id,
        worker_name,
        action,
        job_title,
        job_location,
        request_id,
        is_read,
        created_at
     FROM contractor_notifications
     WHERE contractor_id = ?
     ORDER BY created_at DESC'
);
$stmt->bind_param('i', $contractorId);
$stmt->execute();
$result = $stmt->get_result();
$items = [];

while ($row = $result->fetch_assoc()) {
    $items[] = [
        'id' => (int) $row['id'],
        'worker_name' => (string) $row['worker_name'],
        'action' => (string) $row['action'],
        'job_title' => (string) $row['job_title'],
        'job_location' => $row['job_location'] !== null ? (string) $row['job_location'] : null,
        'request_id' => (int) $row['request_id'],
        'is_read' => (int) $row['is_read'],
        'created_at' => (string) $row['created_at'],
    ];
}

$stmt->close();

respond(true, 'Notifications fetched', $items);

