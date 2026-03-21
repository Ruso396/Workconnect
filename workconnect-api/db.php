<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$jsonInput = json_decode(file_get_contents('php://input'), true);
if (!is_array($jsonInput)) {
    $jsonInput = [];
}

function input(string $key, $default = null)
{
    global $jsonInput;
    if (array_key_exists($key, $jsonInput)) {
        return $jsonInput[$key];
    }
    if (array_key_exists($key, $_POST)) {
        return $_POST[$key];
    }
    if (array_key_exists($key, $_GET)) {
        return $_GET[$key];
    }
    if (array_key_exists($key, $_REQUEST)) {
        return $_REQUEST[$key];
    }
    return $default;
}

try {
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('DB connection failed: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
    exit;
}

function respond(bool $success, string $message, $data = null, int $status = 200): void
{
    http_response_code($status);
    $payload = [
        'success' => $success,
        'message' => $message,
    ];
    if ($data !== null) {
        $payload['data'] = $data;
    }
    echo json_encode($payload);
    exit;
}

function require_fields(array $fields): void
{
    foreach ($fields as $field) {
        $value = input($field, null);
        if ($value === null || trim((string) $value) === '') {
            respond(false, "Missing field: {$field}", null, 422);
        }
    }
}

function workconnect_api_base_url(): string
{
    global $WORKCONNECT_API_BASE_URL;

    if (isset($WORKCONNECT_API_BASE_URL)) {
        $configured = trim((string) $WORKCONNECT_API_BASE_URL);
        if ($configured !== '') {
            return rtrim($configured, '/');
        }
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');

    return $scriptDir !== '' ? sprintf('%s://%s%s', $scheme, $host, $scriptDir) : sprintf('%s://%s', $scheme, $host);
}

/**
 * Normalize profile_image to an absolute URL under workconnect_api_base_url(),
 * using the uploads/... segment so stale hosts in the DB still resolve correctly.
 */
function normalize_profile_image_url(?string $value): ?string
{
    if ($value === null) {
        return null;
    }

    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }

    $uploadsPos = stripos($trimmed, 'uploads/');
    if ($uploadsPos !== false) {
        $relativeUploadsPath = substr($trimmed, $uploadsPos);
    } else {
        $relativeUploadsPath = 'uploads/' . ltrim($trimmed, '/');
    }

    $base = workconnect_api_base_url();

    return sprintf('%s/%s', $base, $relativeUploadsPath);
}

function normalize_role_key(string $value): string
{
  $trimmed = strtolower(trim($value));
  $trimmed = preg_replace('/[^a-z0-9]+/', '_', $trimmed) ?? '';
  $trimmed = trim($trimmed, '_');
  return $trimmed;
}

/**
 * Ensures the contractor has at least the default trade roles.
 * This keeps older installs working without requiring a separate migration script.
 */
function ensure_default_contractor_roles(mysqli $conn, int $contractorId): void
{
  $checkStmt = $conn->prepare('SELECT COUNT(*) AS cnt FROM contractor_roles WHERE contractor_id = ?');
  $checkStmt->bind_param('i', $contractorId);
  $checkStmt->execute();
  $cnt = (int) ($checkStmt->get_result()->fetch_assoc()['cnt'] ?? 0);
  $checkStmt->close();

  if ($cnt > 0) {
    return;
  }

  $defaults = [
    ['mason', 'mason'],
    ['electrician', 'electrician'],
    ['helper', 'helper'],
  ];

  $ins = $conn->prepare(
    'INSERT IGNORE INTO contractor_roles (contractor_id, role_key, role_name) VALUES (?, ?, ?)'
  );
  foreach ($defaults as $pair) {
    $ins->bind_param('iss', $contractorId, $pair[0], $pair[1]);
    $ins->execute();
  }
  $ins->close();
}

/**
 * @return array{id:int,role_key:string,role_name:string}[]
 */
function fetch_contractor_roles(mysqli $conn, int $contractorId): array
{
  ensure_default_contractor_roles($conn, $contractorId);

  $stmt = $conn->prepare(
    'SELECT id, role_key, role_name FROM contractor_roles WHERE contractor_id = ? ORDER BY role_name ASC'
  );
  $stmt->bind_param('i', $contractorId);
  $stmt->execute();
  $result = $stmt->get_result();

  $roles = [];
  while ($row = $result->fetch_assoc()) {
    $roles[] = [
      'id' => (int) $row['id'],
      'role_key' => (string) $row['role_key'],
      'role_name' => (string) $row['role_name'],
    ];
  }

  $stmt->close();
  return $roles;
}

/**
 * @return array{id:int,name:string,phone:string,role:string,status:string,profile_image:?string,location:?string}|null
 */
function fetch_user_profile_payload(mysqli $conn, int $userId): ?array
{
    $stmt = $conn->prepare(
        'SELECT
            u.id,
            u.name,
            u.phone,
            u.role,
            u.status,
            u.profile_image,
            w.location
         FROM users u
         LEFT JOIN workers w
           ON w.phone = u.phone AND u.role = \'worker\'
         WHERE u.id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return null;
    }

    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'phone' => $row['phone'],
        'role' => $row['role'],
        'status' => $row['status'],
        'profile_image' => normalize_profile_image_url($row['profile_image'] ?? null),
        'location' => $row['location'] ?? null,
    ];
}
