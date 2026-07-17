-- Database Schema for Employee Task Tracker
-- Target: MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS employee_task_tracker;
USE employee_task_tracker;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(150) UNIQUE NOT NULL,
    `email` VARCHAR(150) UNIQUE NOT NULL,
    `hashed_password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'employee' NOT NULL, -- Allowed values: 'admin', 'employee'
    `is_active` BOOLEAN DEFAULT TRUE NOT NULL,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(50) DEFAULT 'pending' NOT NULL, -- Allowed values: 'pending', 'in_progress', 'completed'
    `priority` VARCHAR(50) DEFAULT 'medium' NOT NULL, -- Allowed values: 'low', 'medium', 'high'
    `due_date` DATETIME NULL,
    `assigned_to_id` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT `fk_tasks_assigned_to` FOREIGN KEY (`assigned_to_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_tasks_title` (`title`),
    INDEX `idx_tasks_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_notifications_recipient` (`recipient_id`),
    INDEX `idx_notifications_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
