-- ============================================================================
-- DEMO DATA — eventos sintéticos para visualización del dashboard.
--
-- Distribución temporal pensada para que los filtros 1h/24h/7d/30d se vean
-- distintos cuando se conecten:
--   - 5  eventos en última 1 hora
--   - 10 eventos entre 1h-24h
--   - 12 eventos entre 1-7 días
--   - 13 eventos entre 7-30 días
--
-- Estrategia: la stored procedure SOLO escribe a request_events para no
-- chocar con triggers. request_http y request_event_types se pueblan
-- después con SELECT desde request_events.
--
-- Todos los eventos llevan prefijo 'demo-'. Para limpiarlos:
--   DELETE FROM request_events WHERE event_code LIKE 'demo-%';
-- ============================================================================

USE webshield;
SET NAMES utf8mb4;

DELIMITER //

DROP PROCEDURE IF EXISTS gen_demo_events //

CREATE PROCEDURE gen_demo_events()
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE is_anom BOOLEAN;
  DECLARE attack_code VARCHAR(32);
  DECLARE minute_offset INT;

  WHILE i < 40 DO
    -- Distribución temporal
    SET minute_offset = CASE
      WHEN i < 5  THEN FLOOR(RAND() * 60)
      WHEN i < 15 THEN 60 + FLOOR(RAND() * (1440 - 60))
      WHEN i < 27 THEN 1440 + FLOOR(RAND() * (10080 - 1440))
      ELSE 10080 + FLOOR(RAND() * (43200 - 10080))
    END;

    SET is_anom = (RAND() < 0.35);
    SET attack_code = IF(is_anom,
      ELT(FLOOR(1 + RAND() * 5), 'sqli', 'xss', 'traversal', 'encoded', 'admin'),
      NULL);

    INSERT INTO request_events (
      event_code, detected_at, verdict, action, confidence_score,
      primary_attack_type, waf_rule, latency_ms, client_ip, client_country
    ) VALUES (
      CONCAT('demo-', LPAD(i, 4, '0')),
      NOW() - INTERVAL minute_offset MINUTE,
      IF(is_anom, 'anomalous', 'valid'),
      IF(is_anom, IF(RAND() < 0.75, 'blocked', 'flagged'), 'allowed'),
      IF(is_anom, 0.55 + RAND() * 0.45, RAND() * 0.30),
      attack_code,
      IF(is_anom, CONCAT('CRS-', 940000 + FLOOR(RAND() * 5000)), NULL),
      FLOOR(15 + RAND() * 80),
      CONCAT(FLOOR(1 + RAND() * 254), '.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255), '.', FLOOR(1 + RAND() * 254)),
      ELT(FLOOR(1 + RAND() * 6), 'MX', 'US', 'CL', 'RU', 'NL', 'UA')
    );

    SET i = i + 1;
  END WHILE;
END //

DELIMITER ;

CALL gen_demo_events();
DROP PROCEDURE gen_demo_events;

-- Poblamos HTTP details para los demo events (después del procedure para evitar trigger conflict)
INSERT INTO request_http (
  event_id, http_method, uri, host_header, `host`, user_agent,
  content_length, content_type, post_data, get_query, request_headers
)
SELECT
  re.event_id,
  ELT(FLOOR(1 + RAND() * 4), 'GET', 'GET', 'POST', 'PUT'),
  CASE re.primary_attack_type
    WHEN 'sqli'      THEN ELT(FLOOR(1 + RAND() * 3), '/api/login', '/api/user/1', '/admin/auth')
    WHEN 'xss'       THEN ELT(FLOOR(1 + RAND() * 3), '/search', '/api/comments', '/forum/post')
    WHEN 'traversal' THEN ELT(FLOOR(1 + RAND() * 3), '/../../etc/passwd', '/api/files/../', '/static/../../config')
    WHEN 'encoded'   THEN ELT(FLOOR(1 + RAND() * 3), '/api/q?x=%3Cscript%3E', '/search?q=%27OR%27', '/api/data?k=%2e%2e')
    WHEN 'admin'     THEN ELT(FLOOR(1 + RAND() * 4), '/wp-admin/setup.php', '/admin/config.php', '/admin/login', '/phpmyadmin/')
    ELSE ELT(FLOOR(1 + RAND() * 6), '/', '/index.html', '/api/products', '/api/checkout', '/dashboard', '/api/profile')
  END,
  'HTTPS/1.1',
  'webshield.lab.tec.local',
  IF(re.verdict = 'anomalous',
    ELT(FLOOR(1 + RAND() * 4), 'sqlmap/1.7.11', 'curl/8.4.0', 'python-requests/2.31.0', 'Mozilla/5.0 (compatible; Nmap NSE)'),
    ELT(FLOOR(1 + RAND() * 3), 'Mozilla/5.0', 'Chrome/120.0.0.0', 'Safari/537.36')
  ),
  0,
  NULL,
  NULL,
  NULL,
  JSON_OBJECT('Host', 'webshield.lab.tec.local')
FROM request_events re
WHERE re.event_code LIKE 'demo-%';

-- Tabla puente attack_type por evento (después del procedure)
INSERT IGNORE INTO request_event_types (event_id, attack_type_id)
SELECT re.event_id, c.attack_type_id
FROM request_events re
JOIN attack_type_catalog c ON c.code = re.primary_attack_type
WHERE re.event_code LIKE 'demo-%' AND re.primary_attack_type IS NOT NULL;

-- Resumen pos-load
SELECT
  COUNT(*) AS total,
  SUM(verdict = 'anomalous') AS anomalous,
  SUM(action = 'blocked') AS blocked,
  SUM(detected_at >= NOW() - INTERVAL 1 HOUR) AS last_1h,
  SUM(detected_at >= NOW() - INTERVAL 24 HOUR) AS last_24h,
  SUM(detected_at >= NOW() - INTERVAL 7 DAY) AS last_7d,
  SUM(detected_at >= NOW() - INTERVAL 30 DAY) AS last_30d
FROM request_events;
