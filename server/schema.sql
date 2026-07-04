-- ============================================================
-- Car Booking System — MySQL schema
-- Run this once against your database, e.g.:
--   mysql -u root -p car_booking < server/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS car_booking
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE car_booking;

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(64)  NOT NULL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(50)  NOT NULL,
  role          ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  model_th        VARCHAR(255) NOT NULL,
  model_en        VARCHAR(255) NOT NULL,
  plate_number    VARCHAR(100) NOT NULL,
  type            ENUM('van', 'bus', 'sedan', 'pickup') NOT NULL,
  capacity        INT NOT NULL,
  status          ENUM('available', 'maintenance', 'busy') NOT NULL DEFAULT 'available',
  driver_name_th  VARCHAR(255) NOT NULL,
  driver_name_en  VARCHAR(255) NOT NULL,
  driver_phone    VARCHAR(50)  NOT NULL,
  fuel_type_th    VARCHAR(100) NOT NULL,
  fuel_type_en    VARCHAR(100) NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- bookings
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id           VARCHAR(64) NOT NULL PRIMARY KEY,
  vehicle_id   VARCHAR(64) NOT NULL,
  user_id      VARCHAR(64) NOT NULL,
  user_name    VARCHAR(255) NOT NULL,
  user_role    ENUM('student', 'staff', 'admin') NOT NULL,
  user_phone   VARCHAR(50) NOT NULL,
  purpose      TEXT NOT NULL,
  destination  TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  passengers   INT NOT NULL,
  status       ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  notes        TEXT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_bookings_vehicle (vehicle_id),
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------
-- notifications
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id     VARCHAR(64) NULL,
  title_th    VARCHAR(255) NOT NULL,
  title_en    VARCHAR(255) NOT NULL,
  message_th  TEXT NOT NULL,
  message_en  TEXT NOT NULL,
  type        ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
