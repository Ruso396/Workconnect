-- ---------------------------------------------------------------------------
-- WorkConnect: job targeting + contractor notification images
-- Run once on an EXISTING database (idempotent). Database name must match.
-- ---------------------------------------------------------------------------

USE workconnect;

-- 1) project_workers.role_key — required for send_job role filtering
SET @pw_has_role_key :=
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'project_workers'
      AND column_name = 'role_key');

SET @sql := IF(@pw_has_role_key = 0,
  'ALTER TABLE project_workers ADD COLUMN role_key VARCHAR(60) NULL AFTER worker_id',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE project_workers pw
INNER JOIN projects p ON p.id = pw.project_id
INNER JOIN users u ON u.id = pw.worker_id
LEFT JOIN workers w ON w.phone = u.phone AND w.contractor_id = p.contractor_id
SET pw.role_key = NULLIF(TRIM(w.role), '')
WHERE pw.role_key IS NULL;

UPDATE project_workers SET role_key = 'helper' WHERE role_key IS NULL OR TRIM(role_key) = '';

SET @sql := IF(@pw_has_role_key = 0,
  'ALTER TABLE project_workers MODIFY role_key VARCHAR(60) NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) contractor_notifications.worker_profile_image — worker avatar on accept/decline
SET @cn_has_worker_img :=
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'contractor_notifications'
      AND column_name = 'worker_profile_image');

SET @sql := IF(@cn_has_worker_img = 0,
  'ALTER TABLE contractor_notifications ADD COLUMN worker_profile_image VARCHAR(255) NULL AFTER worker_name',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
