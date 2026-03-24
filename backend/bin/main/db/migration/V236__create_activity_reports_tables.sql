-- V1003__create_activity_reports_tables.sql

CREATE TABLE activity_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    employee_name VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id),
    client_name VARCHAR(255) NOT NULL,
    work_post_id UUID NOT NULL REFERENCES work_posts(id),
    work_post_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    ballistic_plate_number VARCHAR(255),
    ballistic_plate_valid_until DATE,
    weapon_registry_number VARCHAR(255),
    weapon_registry_valid_until DATE,
    absence_status VARCHAR(50) NOT NULL,
    divergences TEXT,
    medical_consultation_date DATE,
    medical_consultation_reason VARCHAR(255),
    medical_consultation_doctor VARCHAR(255),
    medical_consultation_result VARCHAR(255),
    supervisor_id UUID REFERENCES employees(id),
    supervisor_name VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE activity_report_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_report_id UUID NOT NULL REFERENCES activity_reports(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE activity_report_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_report_id UUID NOT NULL REFERENCES activity_reports(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
