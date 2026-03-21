<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['contractor_id', 'title', 'target_role', 'location', 'salary', 'description']);

$contractorId = (int) input('contractor_id');
$title = trim((string) input('title'));
$targetRoleInput = (string) input('target_role');
$targetRole = normalize_role_key($targetRoleInput);
$location = trim((string) input('location'));
$salary = trim((string) input('salary'));
$description = trim((string) input('description'));

if ($targetRole === '') {
    respond(false, 'Invalid target_role', null, 422);
}

// Ensure contractor has default roles (for older installs).
ensure_default_contractor_roles($conn, $contractorId);

// Validate target role belongs to contractor.
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

$insertJob = $conn->prepare(
    'INSERT INTO jobs (contractor_id, title, target_role, location, salary, description) VALUES (?, ?, ?, ?, ?, ?)'
);
$insertJob->bind_param('isssss', $contractorId, $title, $targetRole, $location, $salary, $description);

if (!$insertJob->execute()) {
    respond(false, 'Failed to create job alert', null, 500);
}

$jobId = (int) $insertJob->insert_id;
$insertJob->close();

$workerSelector = $conn->prepare(
    "SELECT u.id
     FROM users u
     INNER JOIN workers w
       ON w.phone = u.phone AND u.role = 'worker'
     WHERE w.contractor_id = ?
       AND u.status = 'active'
       AND w.role = ?
     ORDER BY u.id DESC"
);

$workerSelector->bind_param('is', $contractorId, $targetRole);
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
