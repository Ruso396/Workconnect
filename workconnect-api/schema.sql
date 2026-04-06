CREATE DATABASE IF NOT EXISTS workconnect;
USE workconnect;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('worker', 'contractor') NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  profile_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(60) NOT NULL,
  location VARCHAR(160) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  title VARCHAR(160) NOT NULL,
  target_role VARCHAR(60) NOT NULL,
  location VARCHAR(160) NOT NULL,
  salary VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contractor_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  role_key VARCHAR(60) NOT NULL,
  role_name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_contractor_role (contractor_id, role_key)
);

CREATE TABLE IF NOT EXISTS contractor_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  worker_id INT NOT NULL,
  job_id INT NOT NULL,
  request_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  worker_name VARCHAR(120) NOT NULL,
  worker_profile_image VARCHAR(255) NULL,
  job_title VARCHAR(160) NOT NULL,
  job_location VARCHAR(160) NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_notification_request (request_id)
);

CREATE TABLE IF NOT EXISTS job_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  worker_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Migration-safe tweaks for existing installs ----

-- Ensure workers.role is not an ENUM anymore.
SET @workers_role_is_enum :=
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'workers'
      AND column_name = 'role'
      AND data_type = 'enum');

SET @sql := IF(@workers_role_is_enum > 0,
  'ALTER TABLE workers MODIFY role VARCHAR(60) NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure jobs has target_role.
SET @jobs_has_target_role :=
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'jobs'
      AND column_name = 'target_role');

SET @sql := IF(@jobs_has_target_role = 0,
  'ALTER TABLE jobs ADD COLUMN target_role VARCHAR(60) NOT NULL DEFAULT ''helper''',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Attendance (project-wise daily status)
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  worker_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL DEFAULT 'absent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (project_id, worker_id, date),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ensure unique key exists for older installs
SET @attendance_has_unique :=
  (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'workconnect'
      AND table_name = 'attendance'
      AND index_name = 'unique_attendance');

SET @sql := IF(@attendance_has_unique = 0,
  'ALTER TABLE attendance ADD UNIQUE KEY unique_attendance (project_id, worker_id, date)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Projects (contractor-managed job groups)
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractor_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(160) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  description TEXT NULL,
  status ENUM('active', 'pending', 'closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ensure projects.status supports 'pending' (pause state)
SET @projects_status_has_pending :=
  (SELECT LOCATE('''pending''', COLUMN_TYPE) > 0
    FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'projects'
      AND column_name = 'status'
    LIMIT 1);

SET @sql := IF(@projects_status_has_pending = 0,
  'ALTER TABLE projects MODIFY status ENUM(''active'',''pending'',''closed'') NOT NULL DEFAULT ''active''',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure project_status_history exists (older installs)
CREATE TABLE IF NOT EXISTS project_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  status ENUM('active', 'pending', 'closed') NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  KEY idx_project_changed_at (project_id, changed_at)
);

-- Backfill project_status_history for existing projects (best-effort)
INSERT INTO project_status_history (project_id, status, changed_at)
SELECT p.id, 'active', CONCAT(p.start_date, ' 00:00:00')
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM project_status_history h WHERE h.project_id = p.id);

INSERT INTO project_status_history (project_id, status, changed_at)
SELECT p.id, p.status, NOW()
FROM projects p
WHERE p.status <> 'active'
  AND NOT EXISTS (
    SELECT 1 FROM project_status_history h
    WHERE h.project_id = p.id AND h.status = p.status
  );

-- Project status timeline (pause/resume/close history)
CREATE TABLE IF NOT EXISTS project_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  status ENUM('active', 'pending', 'closed') NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  KEY idx_project_changed_at (project_id, changed_at)
);

CREATE TABLE IF NOT EXISTS project_workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  worker_id INT NOT NULL,
  role_key VARCHAR(60) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_project_worker (project_id, worker_id)
);

-- Migration: jobs.project_id (existing DBs)
SET @jobs_has_project_id :=
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'workconnect'
      AND table_name = 'jobs'
      AND column_name = 'project_id');

SET @sql := IF(@jobs_has_project_id = 0,
  'ALTER TABLE jobs ADD COLUMN project_id INT NULL AFTER contractor_id',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_jobs_project :=
  (SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE constraint_schema = 'workconnect'
      AND table_name = 'jobs'
      AND constraint_name = 'fk_jobs_project');

SET @sql := IF(@fk_jobs_project = 0,
  'ALTER TABLE jobs ADD CONSTRAINT fk_jobs_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- project_workers.role_key (per-project trade role for job targeting)
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

-- contractor_notifications.worker_profile_image
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
