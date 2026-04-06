<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('contractor_id') === null || input('project_id') === null) {
    respond(false, 'Missing contractor_id or project_id', null, 422);
}

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');

$stmt = $conn->prepare(
    'SELECT id, contractor_id, name, location, start_date, end_date, description, status, created_at
     FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1'
);
$stmt->bind_param('ii', $projectId, $contractorId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    respond(false, 'Project not found', null, 404);
}

$workersStmt = $conn->prepare(
    "SELECT
        u.id AS user_id,
        u.name,
        u.phone,
        u.profile_image,
        u.status,
        COALESCE(NULLIF(TRIM(pw.role_key), ''), w.role, '') AS role
     FROM project_workers pw
     INNER JOIN users u ON u.id = pw.worker_id AND u.role = 'worker'
     LEFT JOIN workers w ON w.phone = u.phone AND w.contractor_id = ?
     WHERE pw.project_id = ?
     ORDER BY u.name ASC"
);
$workersStmt->bind_param('ii', $contractorId, $projectId);
$workersStmt->execute();
$wResult = $workersStmt->get_result();
$workers = [];

while ($w = $wResult->fetch_assoc()) {
    $workers[] = [
        'user_id' => (int) $w['user_id'],
        'name' => (string) $w['name'],
        'phone' => (string) $w['phone'],
        'role' => (string) ($w['role'] ?? ''),
        'status' => (string) ($w['status'] ?? 'active'),
        'profile_image' => normalize_profile_image_url($w['profile_image'] ?? null),
    ];
}
$workersStmt->close();

$runningDays = compute_project_active_days(
    $conn,
    (int) $row['id'],
    (string) $row['start_date'],
    (string) $row['status']
);

respond(true, 'Project fetched', [
    'id' => (int) $row['id'],
    'contractor_id' => (int) $row['contractor_id'],
    'name' => (string) $row['name'],
    'location' => (string) $row['location'],
    'start_date' => (string) $row['start_date'],
    'end_date' => $row['end_date'] !== null ? (string) $row['end_date'] : null,
    'description' => $row['description'] !== null ? (string) $row['description'] : null,
    'status' => (string) $row['status'],
    'running_days' => $runningDays,
    'created_at' => (string) $row['created_at'],
    'workers' => $workers,
]);
