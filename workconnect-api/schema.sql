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
