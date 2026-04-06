<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');

$cur = $conn->prepare('SELECT status FROM projects WHERE id = ? AND contractor_id = ? LIMIT 1');
$cur->bind_param('ii', $projectId, $contractorId);
$cur->execute();
$row = $cur->get_result()->fetch_assoc();
$cur->close();

if (!$row) {
    respond(false, 'Project not found', null, 404);
}

$current = (string) ($row['status'] ?? '');
if ($current === 'closed') {
    respond(true, 'Project closed', [
        'id' => $projectId,
        'status' => 'closed',
    ]);
}

$conn->begin_transaction();
try {
    $stmt = $conn->prepare(
        "UPDATE projects SET status = 'closed' WHERE id = ? AND contractor_id = ? AND status <> 'closed'"
    );
    $stmt->bind_param('ii', $projectId, $contractorId);
    if (!$stmt->execute()) {
        throw new RuntimeException('Failed to close project');
    }
    $stmt->close();

    $hist = $conn->prepare('INSERT INTO project_status_history (project_id, status) VALUES (?, ?)');
    $status = 'closed';
    $hist->bind_param('is', $projectId, $status);
    if (!$hist->execute()) {
        throw new RuntimeException('Failed to write project history');
    }
    $hist->close();

    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback();
    respond(false, $e->getMessage(), null, 500);
}

respond(true, 'Project closed', [
    'id' => $projectId,
    'status' => 'closed',
]);
