CREATE TABLE shift_change_forms (
    id BIGSERIAL PRIMARY KEY,
    date_of_request DATE NOT NULL,
    requester_full_name VARCHAR(255) NOT NULL,
    requester_sector VARCHAR(255) NOT NULL,
    requester_day_off_date DATE,
    requester_shift_date DATE NOT NULL,
    replacing_full_name VARCHAR(255) NOT NULL,
    replacing_sector VARCHAR(255) NOT NULL,
    replacing_shift_date DATE NOT NULL,
    replacing_day_off_date DATE,
    shift_time VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
