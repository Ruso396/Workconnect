<?php
declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'workconnect';

/**
 * Public base URL of this API (no trailing slash). Must match the React Native app API base.
 * Used to build consistent profile image URLs regardless of stored host in the database.
 * Leave empty to derive from the current request (Host + script directory).
 */
$WORKCONNECT_API_BASE_URL = 'http://192.168.1.6/workconnect-api';
