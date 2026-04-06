<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

require_fields(['worker_id', 'date']);

$workerId = (int) input('worker_id');
$date = trim((string) input('date'));

if ($workerId <= 0) {
    respond(false, 'Invalid worker_id', null, 422);
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    respond(false, 'Invalid date (use YYYY-MM-DD)', null, 422);
}

$userStmt = $conn->prepare("SELECT id FROM users WHERE id = ? AND role = 'worker' LIMIT 1");
$userStmt->bind_param('i', $workerId);
$userStmt->execute();
$userExists = $userStmt->get_result()->fetch_assoc();
$userStmt->close();

if (!$userExists) {
    respond(false, 'Worker not found', null, 404);
}

$stmt = $conn->prepare('SELECT status FROM attendance WHERE worker_id = ? AND date = ?');
$stmt->bind_param('is', $workerId, $date);
$stmt->execute();
$result = $stmt->get_result();

$hasPresent = false;
$hasAbsent = false;
$hasRow = false;

while ($row = $result->fetch_assoc()) {
    $hasRow = true;
    $st = (string) $row['status'];
    if ($st === 'present') {
        $hasPresent = true;
    } elseif ($st === 'absent') {
        $hasAbsent = true;
    }
}
$stmt->close();

$status = null;
if ($hasRow) {
    // If marked present on any project for this date, show present; else absent when only absent rows exist.
    $status = $hasPresent ? 'present' : ($hasAbsent ? 'absent' : null);
}

respond(true, 'Worker attendance fetched', [
    'status' => $status,
]);
