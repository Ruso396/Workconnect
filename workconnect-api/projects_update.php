<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id', 'name', 'location', 'start_date']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');
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

$own = $conn->prepare('SELECT id FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1');
$own->bind_param('ii', $projectId, $contractorId);
$own->execute();
$ok = $own->get_result()->fetch_assoc();
$own->close();

if (!$ok) {
    respond(false, 'Project not found', null, 404);
}

if ($endDate === null && $description === null) {
    $stmt = $conn->prepare(
        'UPDATE projects SET name = ?, location = ?, start_date = ?, end_date = NULL, description = NULL WHERE id = ? AND contractor_id = ?'
    );
    $stmt->bind_param('sssii', $name, $location, $startDate, $projectId, $contractorId);
} elseif ($endDate === null) {
    $stmt = $conn->prepare(
        'UPDATE projects SET name = ?, location = ?, start_date = ?, end_date = NULL, description = ? WHERE id = ? AND contractor_id = ?'
    );
    $stmt->bind_param('ssssii', $name, $location, $startDate, $description, $projectId, $contractorId);
} elseif ($description === null) {
    $stmt = $conn->prepare(
        'UPDATE projects SET name = ?, location = ?, start_date = ?, end_date = ?, description = NULL WHERE id = ? AND contractor_id = ?'
    );
    $stmt->bind_param('ssssii', $name, $location, $startDate, $endDate, $projectId, $contractorId);
} else {
    $stmt = $conn->prepare(
        'UPDATE projects SET name = ?, location = ?, start_date = ?, end_date = ?, description = ? WHERE id = ? AND contractor_id = ?'
    );
    $stmt->bind_param('sssssii', $name, $location, $startDate, $endDate, $description, $projectId, $contractorId);
}

if (!$stmt->execute()) {
    $stmt->close();
    respond(false, 'Failed to update project', null, 500);
}
$stmt->close();

respond(true, 'Project updated', [
    'id' => $projectId,
    'contractor_id' => $contractorId,
    'name' => $name,
    'location' => $location,
    'start_date' => $startDate,
    'end_date' => $endDate,
    'description' => $description,
]);
