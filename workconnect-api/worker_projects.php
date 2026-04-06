<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('worker_id') === null) {
    respond(false, 'Missing worker_id', null, 422);
}

$workerId = (int) input('worker_id');

$stmt = $conn->prepare(
    "SELECT
        p.id,
        p.name,
        p.location,
        p.start_date,
        p.description,
        p.status
     FROM project_workers pw
     INNER JOIN projects p ON p.id = pw.project_id
     WHERE pw.worker_id = ?
     ORDER BY p.start_date DESC, p.id DESC"
);
$stmt->bind_param('i', $workerId);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];

while ($row = $result->fetch_assoc()) {
    $pid = (int) $row['id'];
    $startDate = (string) $row['start_date'];
    $status = (string) $row['status'];
    $runningDays = compute_project_active_days($conn, $pid, $startDate, $status);
    $rows[] = [
        'id' => $pid,
        'name' => (string) $row['name'],
        'location' => (string) $row['location'],
        'start_date' => (string) $row['start_date'],
        'description' => $row['description'] !== null ? (string) $row['description'] : null,
        'status' => $status,
        'running_days' => $runningDays,
    ];
}

$stmt->close();
respond(true, 'Worker projects fetched', $rows);
