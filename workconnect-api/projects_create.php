<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'name', 'location', 'start_date']);

$contractorId = (int) input('contractor_id');
$name = trim((string) input('name'));
$location = trim((string) input('location'));
$startDate = trim((string) input('start_date'));
$endRaw = input('end_date');
$endDate = null;
if ($endRaw !== null && trim((string) $endRaw) !== '') {
    $endDate = trim((string) $endRaw);
}
$descRaw = input('description');
$description = $descRaw !== null && trim((string) $descRaw) !== '' ? trim((string) $descRaw) : null;

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
    respond(false, 'Invalid start_date (use YYYY-MM-DD)', null, 422);
}

if ($endDate !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
    respond(false, 'Invalid end_date (use YYYY-MM-DD)', null, 422);
}

$today = date('Y-m-d');
if ($startDate < $today) {
    respond(false, 'Past dates are not allowed when creating a project', null, 422);
}

$status = 'active';

$conn->begin_transaction();

if ($endDate === null && $description === null) {
    $stmt = $conn->prepare(
        'INSERT INTO projects (contractor_id, name, location, start_date, end_date, description, status)
         VALUES (?, ?, ?, ?, NULL, NULL, ?)'
    );
    $stmt->bind_param('issss', $contractorId, $name, $location, $startDate, $status);
} elseif ($endDate === null) {
    $stmt = $conn->prepare(
        'INSERT INTO projects (contractor_id, name, location, start_date, end_date, description, status)
         VALUES (?, ?, ?, ?, NULL, ?, ?)'
    );
    $stmt->bind_param('isssss', $contractorId, $name, $location, $startDate, $description, $status);
} elseif ($description === null) {
    $stmt = $conn->prepare(
        'INSERT INTO projects (contractor_id, name, location, start_date, end_date, description, status)
         VALUES (?, ?, ?, ?, ?, NULL, ?)'
    );
    $stmt->bind_param('isssss', $contractorId, $name, $location, $startDate, $endDate, $status);
} else {
    $stmt = $conn->prepare(
        'INSERT INTO projects (contractor_id, name, location, start_date, end_date, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('issssss', $contractorId, $name, $location, $startDate, $endDate, $description, $status);
}

if (!$stmt->execute()) {
    $stmt->close();
    $conn->rollback();
    respond(false, 'Failed to create project', null, 500);
}

$projectId = (int) $stmt->insert_id;
$stmt->close();

$hist = $conn->prepare('INSERT INTO project_status_history (project_id, status, changed_at) VALUES (?, ?, ?)');
$changedAt = $startDate . ' 00:00:00';
$hist->bind_param('iss', $projectId, $status, $changedAt);
if (!$hist->execute()) {
    $hist->close();
    $conn->rollback();
    respond(false, 'Failed to create project history', null, 500);
}
$hist->close();

$conn->commit();

respond(true, 'Project created', [
    'id' => $projectId,
    'contractor_id' => $contractorId,
    'name' => $name,
    'location' => $location,
    'start_date' => $startDate,
    'end_date' => $endDate,
    'description' => $description,
    'status' => $status,
]);
