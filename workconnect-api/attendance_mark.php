<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id', 'date']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');
$date = trim((string) input('date'));
$presentWorkerIdsRaw = input('present_worker_ids', []);

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    respond(false, 'Invalid date (use YYYY-MM-DD)', null, 422);
}

if (!is_array($presentWorkerIdsRaw)) {
    respond(false, 'present_worker_ids must be an array', null, 422);
}

$presentSet = [];
foreach ($presentWorkerIdsRaw as $id) {
    $wid = (int) $id;
    if ($wid > 0) {
        $presentSet[$wid] = true;
    }
}

$projectStmt = $conn->prepare('SELECT id FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1');
$projectStmt->bind_param('ii', $projectId, $contractorId);
$projectStmt->execute();
$projectExists = $projectStmt->get_result()->fetch_assoc();
$projectStmt->close();

if (!$projectExists) {
    respond(false, 'Project not found', null, 404);
}

$workersStmt = $conn->prepare(
    "SELECT pw.worker_id
     FROM project_workers pw
     INNER JOIN users u ON u.id = pw.worker_id AND u.role = 'worker'
     WHERE pw.project_id = ?
     ORDER BY pw.worker_id ASC"
);
$workersStmt->bind_param('i', $projectId);
$workersStmt->execute();
$result = $workersStmt->get_result();

$workerIds = [];
while ($row = $result->fetch_assoc()) {
    $workerIds[] = (int) $row['worker_id'];
}
$workersStmt->close();

if ($workerIds === []) {
    respond(false, 'No workers found in this project', null, 422);
}

$upsertStmt = $conn->prepare(
    "INSERT INTO attendance (project_id, worker_id, date, status)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)"
);

$updated = 0;
$presentCount = 0;
$absentCount = 0;

try {
    $conn->begin_transaction();

    foreach ($workerIds as $workerId) {
        $status = isset($presentSet[$workerId]) ? 'present' : 'absent';
        if ($status === 'present') {
            $presentCount++;
        } else {
            $absentCount++;
        }

        $upsertStmt->bind_param('iiss', $projectId, $workerId, $date, $status);
        if (!$upsertStmt->execute()) {
            throw new RuntimeException('Failed to save attendance');
        }
        $updated++;
    }

    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback();
    $upsertStmt->close();
    respond(false, $e->getMessage(), null, 500);
}

$upsertStmt->close();

respond(true, 'Attendance saved', [
    'updated' => $updated,
    'present_count' => $presentCount,
    'absent_count' => $absentCount,
]);
