-- Script para corrigir formatos de horário incorretos na tabela km_controls
-- Executar este script para corrigir os dados já salvos

-- Verificar dados incorretos
SELECT 
    id,
    shift_start,
    shift_end,
    CASE 
        WHEN shift_start ~ '^[0-9]{1,2}$' THEN 'Formato incorreto'
        ELSE 'Formato correto'
    END as status_start,
    CASE 
        WHEN shift_end ~ '^[0-9]{1,2}$' THEN 'Formato incorreto'
        ELSE 'Formato correto'
    END as status_end
FROM km_controls 
WHERE shift_start ~ '^[0-9]{1,2}$' 
   OR shift_end ~ '^[0-9]{1,2}$';

-- Corrigir horários incorretos
-- Exemplo: "80" -> "08:00", "150" -> "15:00"

UPDATE km_controls 
SET shift_start = CASE 
    WHEN shift_start = '80' THEN '08:00'
    WHEN shift_start = '815' THEN '08:15'
    WHEN shift_start = '830' THEN '08:30'
    WHEN shift_start = '900' THEN '09:00'
    WHEN shift_start = '915' THEN '09:15'
    WHEN shift_start = '930' THEN '09:30'
    WHEN shift_start = '1000' THEN '10:00'
    WHEN shift_start = '1015' THEN '10:15'
    WHEN shift_start = '1030' THEN '10:30'
    WHEN shift_start = '1100' THEN '11:00'
    WHEN shift_start = '1115' THEN '11:15'
    WHEN shift_start = '1130' THEN '11:30'
    WHEN shift_start = '1200' THEN '12:00'
    WHEN shift_start = '1215' THEN '12:15'
    WHEN shift_start = '1230' THEN '12:30'
    WHEN shift_start = '1300' THEN '13:00'
    WHEN shift_start = '1315' THEN '13:15'
    WHEN shift_start = '1330' THEN '13:30'
    WHEN shift_start = '1400' THEN '14:00'
    WHEN shift_start = '1415' THEN '14:15'
    WHEN shift_start = '1430' THEN '14:30'
    WHEN shift_start = '1500' THEN '15:00'
    WHEN shift_start = '1515' THEN '15:15'
    WHEN shift_start = '1530' THEN '15:30'
    WHEN shift_start = '1600' THEN '16:00'
    WHEN shift_start = '1615' THEN '16:15'
    WHEN shift_start = '1630' THEN '16:30'
    WHEN shift_start = '1700' THEN '17:00'
    WHEN shift_start = '1715' THEN '17:15'
    WHEN shift_start = '1730' THEN '17:30'
    WHEN shift_start = '1800' THEN '18:00'
    WHEN shift_start = '1815' THEN '18:15'
    WHEN shift_start = '1830' THEN '18:30'
    WHEN shift_start = '1900' THEN '19:00'
    WHEN shift_start = '1915' THEN '19:15'
    WHEN shift_start = '1930' THEN '19:30'
    WHEN shift_start = '2000' THEN '20:00'
    WHEN shift_start = '2015' THEN '20:15'
    WHEN shift_start = '2030' THEN '20:30'
    WHEN shift_start = '2100' THEN '21:00'
    WHEN shift_start = '2115' THEN '21:15'
    WHEN shift_start = '2130' THEN '21:30'
    WHEN shift_start = '2200' THEN '22:00'
    WHEN shift_start = '2215' THEN '22:15'
    WHEN shift_start = '2230' THEN '22:30'
    WHEN shift_start = '2300' THEN '23:00'
    WHEN shift_start = '2315' THEN '23:15'
    WHEN shift_start = '2330' THEN '23:30'
    ELSE shift_start
END
WHERE shift_start ~ '^[0-9]{1,2}$';

UPDATE km_controls 
SET shift_end = CASE 
    WHEN shift_end = '80' THEN '08:00'
    WHEN shift_end = '815' THEN '08:15'
    WHEN shift_end = '830' THEN '08:30'
    WHEN shift_end = '900' THEN '09:00'
    WHEN shift_end = '915' THEN '09:15'
    WHEN shift_end = '930' THEN '09:30'
    WHEN shift_end = '1000' THEN '10:00'
    WHEN shift_end = '1015' THEN '10:15'
    WHEN shift_end = '1030' THEN '10:30'
    WHEN shift_end = '1100' THEN '11:00'
    WHEN shift_end = '1115' THEN '11:15'
    WHEN shift_end = '1130' THEN '11:30'
    WHEN shift_end = '1200' THEN '12:00'
    WHEN shift_end = '1215' THEN '12:15'
    WHEN shift_end = '1230' THEN '12:30'
    WHEN shift_end = '1300' THEN '13:00'
    WHEN shift_end = '1315' THEN '13:15'
    WHEN shift_end = '1330' THEN '13:30'
    WHEN shift_end = '1400' THEN '14:00'
    WHEN shift_end = '1415' THEN '14:15'
    WHEN shift_end = '1430' THEN '14:30'
    WHEN shift_end = '1500' THEN '15:00'
    WHEN shift_end = '1515' THEN '15:15'
    WHEN shift_end = '1530' THEN '15:30'
    WHEN shift_end = '1600' THEN '16:00'
    WHEN shift_end = '1615' THEN '16:15'
    WHEN shift_end = '1630' THEN '16:30'
    WHEN shift_end = '1700' THEN '17:00'
    WHEN shift_end = '1715' THEN '17:15'
    WHEN shift_end = '1730' THEN '17:30'
    WHEN shift_end = '1800' THEN '18:00'
    WHEN shift_end = '1815' THEN '18:15'
    WHEN shift_end = '1830' THEN '18:30'
    WHEN shift_end = '1900' THEN '19:00'
    WHEN shift_end = '1915' THEN '19:15'
    WHEN shift_end = '1930' THEN '19:30'
    WHEN shift_end = '2000' THEN '20:00'
    WHEN shift_end = '2015' THEN '20:15'
    WHEN shift_end = '2030' THEN '20:30'
    WHEN shift_end = '2100' THEN '21:00'
    WHEN shift_end = '2115' THEN '21:15'
    WHEN shift_end = '2130' THEN '21:30'
    WHEN shift_end = '2200' THEN '22:00'
    WHEN shift_end = '2215' THEN '22:15'
    WHEN shift_end = '2230' THEN '22:30'
    WHEN shift_end = '2300' THEN '23:00'
    WHEN shift_end = '2315' THEN '23:15'
    WHEN shift_end = '2330' THEN '23:30'
    ELSE shift_end
END
WHERE shift_end ~ '^[0-9]{1,2}$';

-- Verificar se a correção funcionou
SELECT 
    id,
    shift_start,
    shift_end,
    CASE 
        WHEN shift_start ~ '^[0-9]{2}:[0-9]{2}$' THEN 'Formato correto'
        ELSE 'Ainda incorreto: ' || shift_start
    END as status_start,
    CASE 
        WHEN shift_end ~ '^[0-9]{2}:[0-9]{2}$' THEN 'Formato correto'
        ELSE 'Ainda incorreto: ' || shift_end
    END as status_end
FROM km_controls;
