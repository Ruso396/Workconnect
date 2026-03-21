<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

// Expect multipart/form-data with fields: user_id, role (optional) and file field "image"

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method', null, 405);
}

if (!isset($_POST['user_id']) || trim((string) $_POST['user_id']) === '') {
    respond(false, 'Missing field: user_id', null, 422);
}

$userId = (int) $_POST['user_id'];

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    respond(false, 'Image upload failed', null, 422);
}

$file = $_FILES['image'];

$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
if (!in_array($file['type'], $allowedTypes, true)) {
    respond(false, 'Invalid image type', null, 422);
}

$uploadDir = __DIR__ . '/uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$extension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
$filename = 'profile_' . $userId . '_' . time() . '.' . $extension;
$targetPath = $uploadDir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    respond(false, 'Failed to save image', null, 500);
}

// Store a stable relative path; absolute URL is built via normalize_profile_image_url().
$dbPath = 'uploads/' . $filename;

$stmt = $conn->prepare('UPDATE users SET profile_image = ? WHERE id = ?');
$stmt->bind_param('si', $dbPath, $userId);

if (!$stmt->execute()) {
    $stmt->close();
    respond(false, 'Failed to update profile image', null, 500);
}

$stmt->close();

$payload = fetch_user_profile_payload($conn, $userId);
if ($payload === null) {
    respond(false, 'User not found', null, 404);
}

respond(true, 'Profile image updated', $payload);

