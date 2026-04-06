<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id', 'target_role', 'location', 'salary', 'description']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');
$targetRoleInput = (string) input('target_role');
$targetRole = normalize_role_key($targetRoleInput);
$location = trim((string) input('location'));
$salary = trim((string) input('salary'));
$description = trim((string) input('description'));

if ($targetRole === '') {
    respond(false, 'Invalid target_role', null, 422);
}

ensure_default_contractor_roles($conn, $contractorId);

$roleCheck = $conn->prepare(
    'SELECT id FROM contractor_roles WHERE contractor_id = ? AND role_key = ? LIMIT 1'
);
$roleCheck->bind_param('is', $contractorId, $targetRole);
$roleCheck->execute();
$roleRow = $roleCheck->get_result()->fetch_assoc();
$roleCheck->close();

if (!$roleRow) {
    respond(false, 'Unknown target_role for this contractor', null, 422);
}

$projStmt = $conn->prepare(
    "SELECT id, name, status FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1"
);
$projStmt->bind_param('ii', $projectId, $contractorId);
$projStmt->execute();
$projRow = $projStmt->get_result()->fetch_assoc();
$projStmt->close();

if (!$projRow) {
    respond(false, 'Project not found', null, 404);
}

if (($projRow['status'] ?? '') !== 'active') {
    respond(false, 'Project is closed. Only active projects can receive job alerts.', null, 422);
}

$jobTitle = (string) $projRow['name'];

$insertJob = $conn->prepare(
    'INSERT INTO jobs (contractor_id, project_id, title, target_role, location, salary, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$insertJob->bind_param('iisssss', $contractorId, $projectId, $jobTitle, $targetRole, $location, $salary, $description);

if (!$insertJob->execute()) {
    respond(false, 'Failed to create job alert', null, 500);
}

$jobId = (int) $insertJob->insert_id;
$insertJob->close();

$workerSelector = $conn->prepare(
    "SELECT pw.worker_id AS id
     FROM project_workers pw
     INNER JOIN users u ON u.id = pw.worker_id AND u.role = 'worker'
     WHERE pw.project_id = ?
       AND pw.role_key = ?
       AND u.status = 'active'
     ORDER BY u.id DESC"
);
$workerSelector->bind_param('is', $projectId, $targetRole);
$workerSelector->execute();
$workerResult = $workerSelector->get_result();

$insertRequest = $conn->prepare('INSERT INTO job_requests (job_id, worker_id, status) VALUES (?, ?, ?)');
$requestStatus = 'pending';
$assignedCount = 0;

while ($worker = $workerResult->fetch_assoc()) {
    $workerId = (int) $worker['id'];
    $insertRequest->bind_param('iis', $jobId, $workerId, $requestStatus);
    if ($insertRequest->execute()) {
        $assignedCount++;
    }
}

$insertRequest->close();
$workerSelector->close();

respond(true, 'Job notification sent', [
    'job_id' => $jobId,
    'assigned_count' => $assignedCount,
]);
