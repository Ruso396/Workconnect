<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('worker_id') === null) {
    respond(false, 'Missing worker_id', null, 422);
}

$workerId = (int) input('worker_id');
$stmt = $conn->prepare(
    'SELECT
        jr.id AS request_id,
        jr.status,
        jr.created_at,
        j.id AS job_id,
        j.title,
        j.location,
        j.salary,
        j.description,
        c.name AS contractor_name,
        c.profile_image AS contractor_profile_image
     FROM job_requests jr
     INNER JOIN jobs j ON j.id = jr.job_id
     INNER JOIN users c ON c.id = j.contractor_id AND c.role = \'contractor\'
     WHERE jr.worker_id = ?
     ORDER BY jr.id DESC'
);
$stmt->bind_param('i', $workerId);
$stmt->execute();
$result = $stmt->get_result();
$jobs = [];

while ($row = $result->fetch_assoc()) {
    $jobs[] = [
        'request_id' => (int) $row['request_id'],
        'status' => $row['status'],
        'job_id' => (int) $row['job_id'],
        'title' => $row['title'],
        'location' => $row['location'],
        'salary' => $row['salary'],
        'description' => $row['description'],
        'contractor_name' => (string) ($row['contractor_name'] ?? ''),
        'contractor_profile_image' => normalize_profile_image_url($row['contractor_profile_image'] ?? null),
        'created_at' => (string) $row['created_at'],
    ];
}

$stmt->close();
respond(true, 'Jobs fetched', $jobs);
