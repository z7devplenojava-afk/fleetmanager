-- Migration: Alter salary column in orders_of_service table to DECIMAL(15,9)
-- Version: V356
-- Description: Changes the salary column from DECIMAL(10,2) to DECIMAL(15,9) to support higher precision

ALTER TABLE orders_of_service
    ALTER COLUMN salary TYPE DECIMAL(15,9);

COMMENT ON COLUMN orders_of_service.salary IS 'Salary value with precision 15 and scale 9 (supports up to 15 digits with 9 decimal places)';











