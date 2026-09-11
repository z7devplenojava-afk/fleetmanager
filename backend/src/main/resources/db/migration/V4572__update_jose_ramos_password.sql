-- Migration V4572: Update jose.ramos password to FluxBus@2026
UPDATE users
SET password = '$2a$10$bkUVgot9Tz0vWDSCd4ILTuIISiTrjkYu2Fhapuh.TtFEMhr5Eiwji'
WHERE username = 'jose.ramos';
