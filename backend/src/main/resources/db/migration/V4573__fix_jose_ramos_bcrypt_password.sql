-- Migration V4573: Fix valid BCrypt password hash for jose.ramos (FluxBus@2026)
UPDATE users
SET password = '$2b$10$XocoOdFAeCAVtZ0t13YjruW2ERTvADbP71h3h2aYkiMWNl5MvnVcG',
    active = true,
    status = 'ACTIVE'
WHERE LOWER(username) = 'jose.ramos' OR email = 'jose.ramos@dominio.com';

