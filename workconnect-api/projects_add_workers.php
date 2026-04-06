<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');
$workerIdsRaw = input('worker_ids');

if (!is_array($workerIdsRaw)) {
    respond(false, 'worker_ids must be an array', null, 422);
}

$workerIds = [];
foreach ($workerIdsRaw as $id) {
    $workerIds[] = (int) $id;
}
$workerIds = array_values(array_unique(array_filter($workerIds, static fn (int $v): bool => $v > 0)));

if ($workerIds === []) {
    respond(false, 'No valid worker_ids', null, 422);
}

$proj = $conn->prepare('SELECT id FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1');
$proj->bind_param('ii', $projectId, $contractorId);
$proj->execute();
$pok = $proj->get_result()->fetch_assoc();
$proj->close();

if (!$pok) {
    respond(false, 'Project not found', null, 404);
}

$placeholders = implode(',', array_fill(0, count($workerIds), '?'));
$types = str_repeat('i', count($workerIds));
$sql = "SELECT u.id, w.role AS worker_role
        FROM users u
        INNER JOIN workers w ON w.phone = u.phone AND u.role = 'worker'
        WHERE u.id IN ($placeholders)
          AND w.contractor_id = ?
          AND u.status = 'active'";

$stmt = $conn->prepare($sql);
$params = [...$workerIds, $contractorId];
$bindTypes = $types . 'i';
$stmt->bind_param($bindTypes, ...$params);
$stmt->execute();
$res = $stmt->get_result();
$allowed = [];
while ($r = $res->fetch_assoc()) {
    $uid = (int) $r['id'];
    $roleKey = normalize_role_key((string) ($r['worker_role'] ?? ''));
    if ($roleKey === '') {
        $roleKey = 'helper';
    }
    $allowed[$uid] = $roleKey;
}
$stmt->close();

if ($allowed === []) {
    respond(false, 'No workers matched this contractor', null, 422);
}

$insert = $conn->prepare(
    'INSERT INTO project_workers (project_id, worker_id, role_key)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role_key = VALUES(role_key)'
);
$added = 0;
foreach ($allowed as $wid => $roleKey) {
    $insert->bind_param('iis', $projectId, $wid, $roleKey);
    if ($insert->execute()) {
        if ($insert->affected_rows === 1) {
            $added++;
        }
    }
}
$insert->close();

respond(true, 'Workers added to project', [
    'added_count' => $added,
    'worker_ids' => array_keys($allowed),
]);
