-- Criar tabelas de coleção para visitas
-- visit_employees
CREATE TABLE IF NOT EXISTS visit_employees (
    visit_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    PRIMARY KEY (visit_id, employee_id),
    CONSTRAINT fk_visit_employees_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- visit_files
CREATE TABLE IF NOT EXISTS visit_files (
    visit_id UUID NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    PRIMARY KEY (visit_id, file_path),
    CONSTRAINT fk_visit_files_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- visit_photos
CREATE TABLE IF NOT EXISTS visit_photos (
    visit_id UUID NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    PRIMARY KEY (visit_id, photo_path),
    CONSTRAINT fk_visit_photos_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('visit_employees', 'visit_files', 'visit_photos')
ORDER BY table_name;
