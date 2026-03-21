<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('contractor_id') === null) {
    respond(false, 'Missing contractor_id', null, 422);
}

$contractorId = (int) input('contractor_id');

$stmt = $conn->prepare(
    'SELECT
        w.id,
        w.contractor_id,
        COALESCE(u.name, w.name) AS name,
        w.phone,
        w.role,
        w.location,
        u.profile_image,
        u.status
     FROM workers w
     LEFT JOIN users u
       ON u.phone = w.phone AND u.role = "worker"
     WHERE w.contractor_id = ?
     ORDER BY w.id DESC'
);
$stmt->bind_param('i', $contractorId);
$stmt->execute();
$result = $stmt->get_result();
$workers = [];

while ($row = $result->fetch_assoc()) {
    $workers[] = [
        'id' => (int) $row['id'],
        'contractor_id' => (int) $row['contractor_id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'role' => $row['role'],
        'location' => $row['location'],
        'profile_image' => normalize_profile_image_url($row['profile_image'] ?? null),
        'status' => $row['status'] ?? 'active',
    ];
}

$stmt->close();
respond(true, 'Workers fetched', $workers);
