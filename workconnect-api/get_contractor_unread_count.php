<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_fields(['contractor_id']);

$contractorId = (int) input('contractor_id');

$stmt = $conn->prepare(
    'SELECT COUNT(*) AS cnt FROM contractor_notifications WHERE contractor_id = ? AND is_read = 0'
);
$stmt->bind_param('i', $contractorId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

respond(true, 'Unread count fetched', [
    'count' => (int) ($row['cnt'] ?? 0),
]);

