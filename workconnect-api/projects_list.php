<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('contractor_id') === null) {
    respond(false, 'Missing contractor_id', null, 422);
}

$contractorId = (int) input('contractor_id');

$statusFilter = input('status', null);
$sql = 'SELECT id, contractor_id, name, location, start_date, end_date, description, status, created_at
        FROM projects WHERE contractor_id = ?';
$types = 'i';
$params = [$contractorId];

if ($statusFilter !== null && trim((string) $statusFilter) !== '') {
    $sql .= ' AND status = ?';
    $types .= 's';
    $params[] = trim((string) $statusFilter);
}

$sql .= ' ORDER BY id DESC';

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
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
        'contractor_id' => (int) $row['contractor_id'],
        'name' => (string) $row['name'],
        'location' => (string) $row['location'],
        'start_date' => (string) $row['start_date'],
        'end_date' => $row['end_date'] !== null ? (string) $row['end_date'] : null,
        'description' => $row['description'] !== null ? (string) $row['description'] : null,
        'status' => $status,
        'running_days' => $runningDays,
        'created_at' => (string) $row['created_at'],
    ];
}

$stmt->close();
respond(true, 'Projects fetched', $rows);
