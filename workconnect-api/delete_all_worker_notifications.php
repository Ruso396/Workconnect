<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['worker_id']);

$workerId = (int) input('worker_id');

$verify = $conn->prepare("SELECT id FROM users WHERE id = ? AND role = 'worker' LIMIT 1");
$verify->bind_param('i', $workerId);
$verify->execute();
$ok = $verify->get_result()->fetch_assoc();
$verify->close();

if (!$ok) {
    respond(false, 'Worker not found', null, 404);
}

$conn->begin_transaction();

try {
    $delCn = $conn->prepare(
        'DELETE cn FROM contractor_notifications cn
         INNER JOIN job_requests jr ON jr.id = cn.request_id
         WHERE jr.worker_id = ?'
    );
    $delCn->bind_param('i', $workerId);
    if (!$delCn->execute()) {
        throw new RuntimeException('Failed to delete related contractor notifications');
    }
    $delCn->close();

    $delJr = $conn->prepare('DELETE FROM job_requests WHERE worker_id = ?');
    $delJr->bind_param('i', $workerId);
    if (!$delJr->execute()) {
        throw new RuntimeException('Failed to delete job notifications');
    }
    $deletedCount = (int) ($delJr->affected_rows ?? 0);
    $delJr->close();

    $conn->commit();
} catch (Throwable $e) {
    $conn->rollback();
    respond(false, $e->getMessage(), null, 500);
}

respond(true, 'All notifications deleted', [
    'deleted_count' => $deletedCount,
]);
