<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('worker_id') === null || input('project_id') === null) {
    respond(false, 'Missing worker_id or project_id', null, 422);
}

$workerId = (int) input('worker_id');
$projectId = (int) input('project_id');

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
     WHERE pw.worker_id = ? AND p.id = ?
     LIMIT 1"
);
$stmt->bind_param('ii', $workerId, $projectId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    respond(false, 'Project not found', null, 404);
}

$runningDays = compute_project_active_days(
    $conn,
    (int) $row['id'],
    (string) $row['start_date'],
    (string) $row['status']
);

respond(true, 'Worker project fetched', [
    'id' => (int) $row['id'],
    'name' => (string) $row['name'],
    'location' => (string) $row['location'],
    'start_date' => (string) $row['start_date'],
    'description' => $row['description'] !== null ? (string) $row['description'] : null,
    'status' => (string) $row['status'],
    'running_days' => $runningDays,
]);
