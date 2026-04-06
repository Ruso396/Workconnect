<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['contractor_id', 'project_id']);

$contractorId = (int) input('contractor_id');
$projectId = (int) input('project_id');

$stmt = $conn->prepare('DELETE FROM projects WHERE id = ? AND contractor_id = ?');
$stmt->bind_param('ii', $projectId, $contractorId);
$stmt->execute();
$affected = $stmt->affected_rows;
$stmt->close();

if ($affected === 0) {
    respond(false, 'Project not found', null, 404);
}

respond(true, 'Project deleted', ['deleted' => true]);
