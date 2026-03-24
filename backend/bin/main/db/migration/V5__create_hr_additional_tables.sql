-- Tabela de treinamentos (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') THEN
        CREATE TABLE trainings (
            id UUID PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            provider VARCHAR(100),
            duration INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Tabela de certificações dos funcionários (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_certifications') THEN
        CREATE TABLE employee_certifications (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            training_id UUID NOT NULL,
            certification_number VARCHAR(50),
            issue_date DATE NOT NULL,
            expiration_date DATE,
            status VARCHAR(20) NOT NULL,
            document_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (training_id) REFERENCES trainings(id)
        );
    END IF;
END $$;

-- Tabela de avaliações (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_evaluations') THEN
        CREATE TABLE performance_evaluations (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            evaluator_id UUID NOT NULL,
            evaluation_date DATE NOT NULL,
            evaluation_type VARCHAR(50) NOT NULL,
            score DECIMAL(3,1),
            comments TEXT,
            status VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id),
            FOREIGN KEY (evaluator_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Tabela de dependentes (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependents') THEN
        CREATE TABLE dependents (
            id UUID PRIMARY KEY,
            employee_id UUID NOT NULL,
            name VARCHAR(100) NOT NULL,
            relationship VARCHAR(50) NOT NULL,
            birth_date DATE NOT NULL,
            cpf VARCHAR(14),
            rg VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        );
    END IF;
END $$;

-- Tabela de permissões (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        CREATE TABLE permissions (
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Tabela de papéis (roles) (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        CREATE TABLE roles (
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Tabela de permissões por papel (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        CREATE TABLE role_permissions (
            role_id UUID NOT NULL,
            permission_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id),
            FOREIGN KEY (permission_id) REFERENCES permissions(id)
        );
    END IF;
END $$;

-- Tabela de papéis por usuário (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        CREATE TABLE user_roles (
            user_id UUID NOT NULL,
            role_id UUID NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (role_id) REFERENCES roles(id)
        );
    END IF;
END $$;

-- Triggers para atualizar o updated_at (idempotentes)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') THEN
        DROP TRIGGER IF EXISTS update_trainings_updated_at ON trainings;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_trainings_updated_at
                BEFORE UPDATE ON trainings
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_certifications') THEN
        DROP TRIGGER IF EXISTS update_employee_certifications_updated_at ON employee_certifications;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_employee_certifications_updated_at
                BEFORE UPDATE ON employee_certifications
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_evaluations') THEN
        DROP TRIGGER IF EXISTS update_performance_evaluations_updated_at ON performance_evaluations;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_performance_evaluations_updated_at
                BEFORE UPDATE ON performance_evaluations
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dependents') THEN
        DROP TRIGGER IF EXISTS update_dependents_updated_at ON dependents;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_dependents_updated_at
                BEFORE UPDATE ON dependents
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_permissions_updated_at
                BEFORE UPDATE ON permissions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
        IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE TRIGGER update_roles_updated_at
                BEFORE UPDATE ON roles
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
