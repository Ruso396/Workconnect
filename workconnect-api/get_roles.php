<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

if (input('contractor_id') === null) {
    respond(false, 'Missing contractor_id', null, 422);
}

$contractorId = (int) input('contractor_id');
$roles = fetch_contractor_roles($conn, $contractorId);

respond(true, 'Roles fetched', $roles);

