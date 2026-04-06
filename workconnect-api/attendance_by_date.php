<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id', 'date']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');
$date = trim((string) input('date'));

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    respond(false, 'Invalid date (use YYYY-MM-DD)', null, 422);
}

$projectStmt = $conn->prepare('SELECT id FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1');
$projectStmt->bind_param('ii', $projectId, $contractorId);
$projectStmt->execute();
$projectExists = $projectStmt->get_result()->fetch_assoc();
$projectStmt->close();

if (!$projectExists) {
    respond(false, 'Project not found', null, 404);
}

$stmt = $conn->prepare(
    "SELECT
        u.id AS user_id,
        u.name,
        COALESCE(w.role, '') AS role,
        u.profile_image,
        a.status
     FROM project_workers pw
     INNER JOIN users u ON u.id = pw.worker_id AND u.role = 'worker'
     LEFT JOIN workers w ON w.phone = u.phone AND w.contractor_id = ?
     LEFT JOIN attendance a
       ON a.project_id = pw.project_id
      AND a.worker_id = pw.worker_id
      AND a.date = ?
     WHERE pw.project_id = ?
     ORDER BY u.name ASC"
);
$stmt->bind_param('isi', $contractorId, $date, $projectId);
$stmt->execute();
$result = $stmt->get_result();

$presentWorkers = [];
$absentWorkers = [];
$alreadyMarked = false;
while ($row = $result->fetch_assoc()) {
    $worker = [
        'user_id' => (int) $row['user_id'],
        'name' => (string) $row['name'],
        'role' => (string) $row['role'],
        'profile_image' => normalize_profile_image_url($row['profile_image'] ?? null),
    ];

    $status = isset($row['status']) ? (string) $row['status'] : '';
    if ($status === 'present') {
        $alreadyMarked = true;
        $presentWorkers[] = $worker;
    } elseif ($status === 'absent') {
        $alreadyMarked = true;
        $absentWorkers[] = $worker;
    } else {
        $absentWorkers[] = $worker;
    }
}
$stmt->close();

respond(true, 'Attendance fetched', [
    'already_marked' => $alreadyMarked,
    'present_workers' => $presentWorkers,
    'absent_workers' => $absentWorkers,
]);
