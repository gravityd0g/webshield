USE webshield;

SET NAMES utf8mb4;

INSERT IGNORE INTO users (email, password_hash, display_name) VALUES
    (
        'natrogue28@gmail.com',
        '$2b$12$3AAcGC2oS4dwAvrT1xau/eenVbdKizlR1hjVjEwCFxbsf88Vl0cCy',
        'Nat Rogue'
    ),
    (
        'admin@webshield.lab',
        '$2b$12$3AAcGC2oS4dwAvrT1xau/eenVbdKizlR1hjVjEwCFxbsf88Vl0cCy',
        'WebShield Admin'
    );

INSERT INTO model_health_snapshots (predictions_per_second, rolling_accuracy, drift_score, status)
SELECT 142, 0.91800, 0.07000, 'healthy'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM model_health_snapshots);

INSERT IGNORE INTO request_events (
    event_code, detected_at, verdict, action, confidence_score,
    primary_attack_type, waf_rule, latency_ms, client_ip, client_country
) VALUES
    ('evt-9281', NOW() - INTERVAL 2 MINUTE,  'anomalous', 'blocked', 0.94000, 'sqli',      'CRS-942100', 21, '192.168.1.47',   NULL),
    ('evt-9280', NOW() - INTERVAL 4 MINUTE,  'valid',     'allowed', 0.02000, NULL,        NULL,         18, '10.0.5.21',      NULL),
    ('evt-9279', NOW() - INTERVAL 6 MINUTE,  'anomalous', 'blocked', 0.89000, 'xss',       'CRS-941100', 24, '203.0.113.8',    'CL'),
    ('evt-9278', NOW() - INTERVAL 8 MINUTE,  'valid',     'allowed', 0.04000, NULL,        NULL,         19, '10.0.5.21',      NULL),
    ('evt-9277', NOW() - INTERVAL 10 MINUTE, 'anomalous', 'blocked', 0.97000, 'traversal', 'CRS-930100', 22, '198.51.100.15',  'NL'),
    ('evt-9275', NOW() - INTERVAL 14 MINUTE, 'anomalous', 'flagged', 0.62000, 'admin',     'CRS-932100', 25, '203.0.113.8',    'CL'),
    ('evt-9273', NOW() - INTERVAL 18 MINUTE, 'anomalous', 'blocked', 0.81000, 'admin',     'CRS-913100', 23, '45.155.205.211', 'RU'),
    ('evt-9272', NOW() - INTERVAL 20 MINUTE, 'anomalous', 'blocked', 0.91000, 'sqli',      'CRS-942110', 20, '192.168.1.47',   NULL);

INSERT IGNORE INTO request_http (
    event_id, http_method, uri, user_agent, post_data, get_query, request_headers
)
SELECT re.event_id, v.http_method, v.uri, v.user_agent, v.post_data, v.get_query, v.request_headers
FROM request_events re
JOIN (
    SELECT 'evt-9281' AS event_code, 'POST' AS http_method, '/api/login' AS uri, 'curl/8.4.0' AS user_agent,
           '{"username":"admin","password":"'' OR 1=1 --"}' AS post_data, NULL AS get_query,
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'curl/8.4.0', 'Content-Type', 'application/json') AS request_headers
    UNION ALL SELECT 'evt-9280', 'GET', '/index.html', 'Mozilla/5.0', NULL, NULL,
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'Mozilla/5.0')
    UNION ALL SELECT 'evt-9279', 'GET', '/search', 'sqlmap/1.7.11', NULL, 'q=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'sqlmap/1.7.11', 'Referer', '/')
    UNION ALL SELECT 'evt-9278', 'GET', '/api/products', 'Mozilla/5.0', NULL, 'category=electronics',
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'Mozilla/5.0')
    UNION ALL SELECT 'evt-9277', 'GET', '/../../../../etc/passwd', 'python-requests/2.31.0', NULL, NULL,
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'python-requests/2.31.0')
    UNION ALL SELECT 'evt-9275', 'GET', '/admin/config.php', 'Mozilla/5.0', NULL, NULL,
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'Mozilla/5.0')
    UNION ALL SELECT 'evt-9273', 'GET', '/wp-admin/setup-config.php', 'Mozilla/5.0 (compatible; Nmap NSE)', NULL, 'step=1',
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'Mozilla/5.0 (compatible; Nmap NSE)')
    UNION ALL SELECT 'evt-9272', 'GET', '/api/user/1%20OR%201%3D1', 'curl/8.4.0', NULL, NULL,
           JSON_OBJECT('Host', 'webshield.lab.tec.local', 'User-Agent', 'curl/8.4.0')
) v ON re.event_code = v.event_code;

INSERT IGNORE INTO request_event_features (event_id, feature_name, feature_value, contribution)
SELECT re.event_id, v.feature_name, v.feature_value, v.contribution
FROM request_events re
JOIN (
    SELECT 'evt-9281' AS event_code, 'has_sql_kw' AS feature_name, 1 AS feature_value, 0.4100 AS contribution
    UNION ALL SELECT 'evt-9281', 'cnt_quote', 4, 0.1800
    UNION ALL SELECT 'evt-9281', 'cnt_comment', 1, 0.1400
    UNION ALL SELECT 'evt-9281', 'len_POST_Data', 52, 0.0900
    UNION ALL SELECT 'evt-9281', 'has_admin', 1, 0.0700
    UNION ALL SELECT 'evt-9279', 'has_xss_kw', 1, 0.3800
    UNION ALL SELECT 'evt-9279', 'has_encoded', 1, 0.2200
    UNION ALL SELECT 'evt-9279', 'cnt_percent', 8, 0.1300
    UNION ALL SELECT 'evt-9279', 'len_GET_Query', 44, 0.0900
    UNION ALL SELECT 'evt-9277', 'has_traversal', 1, 0.5200
    UNION ALL SELECT 'evt-9277', 'cnt_dot', 8, 0.2400
    UNION ALL SELECT 'evt-9277', 'cnt_slash', 5, 0.1200
    UNION ALL SELECT 'evt-9272', 'has_sql_kw', 1, 0.3900
    UNION ALL SELECT 'evt-9272', 'has_encoded', 1, 0.2100
    UNION ALL SELECT 'evt-9272', 'cnt_percent', 4, 0.1100
) v ON re.event_code = v.event_code;
