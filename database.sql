CREATE DATABASE IF NOT EXISTS smart_clinic
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_clinic;

CREATE TABLE IF NOT EXISTS doctors (
    doctor_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (doctor_id),
    UNIQUE KEY uq_doctors_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
    appointment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    patient_name VARCHAR(80) NOT NULL,
    doctor_id INT UNSIGNED NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (appointment_id),
    UNIQUE KEY uq_appointments_doctor_slot
        (doctor_id, appointment_date, appointment_time),
    KEY idx_appointments_date_time (appointment_date, appointment_time),
    CONSTRAINT fk_appointments_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO doctors (name, specialty)
VALUES
    ('Kavitha1506', 'General Physician'),
    ('Arjun1306', 'Cardiologist'),
    ('Nila1106', 'Dermatologist')
ON DUPLICATE KEY UPDATE specialty = VALUES(specialty);
