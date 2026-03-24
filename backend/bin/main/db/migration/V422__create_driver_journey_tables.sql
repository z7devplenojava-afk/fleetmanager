DROP TABLE IF EXISTS time_banks CASCADE;

CREATE TABLE driver_journeys (
    id UUID NOT NULL,
    driver_id UUID NOT NULL,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    type VARCHAR(255) NOT NULL,
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT pk_driver_journeys PRIMARY KEY (id)
);

CREATE TABLE time_banks (
    id UUID NOT NULL,
    driver_id UUID NOT NULL,
    balance_minutes BIGINT NOT NULL,
    last_updated TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT pk_time_banks PRIMARY KEY (id)
);

ALTER TABLE driver_journeys ADD CONSTRAINT FK_DRIVER_JOURNEYS_ON_DRIVER FOREIGN KEY (driver_id) REFERENCES users (id);
ALTER TABLE time_banks ADD CONSTRAINT FK_TIME_BANKS_ON_DRIVER FOREIGN KEY (driver_id) REFERENCES users (id);
ALTER TABLE time_banks ADD CONSTRAINT uc_time_banks_driver UNIQUE (driver_id);
