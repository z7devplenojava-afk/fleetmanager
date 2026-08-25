-- Migration V4560: Limpeza de registros de veículos gerados por erro de importação
-- (onde a palavra 'RENAVAM' ou um número de RENAVAM de 9 a 11 dígitos foi inserido incorretamente como Placa)

DELETE FROM vehicles 
WHERE UPPER(TRIM(plate)) IN ('RENAVAM', 'RENAVAN', 'PLACA', 'PLATE', 'PATRIMONIO', 'PATRIMÔNIO', 'CHASSI', 'CHASSIS', 'MODELO', 'MARCA', 'ANO', 'COR', 'STATUS')
   OR (LENGTH(REGEXP_REPLACE(plate, '\D', '', 'g')) >= 9 
       AND LENGTH(REGEXP_REPLACE(plate, '\D', '', 'g')) <= 11 
       AND plate !~ '[A-Za-z]');
