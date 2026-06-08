DROP DATABASE IF EXISTS webshield;

CREATE DATABASE IF NOT EXISTS webshield
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE webshield;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS attack_type_catalog (
    attack_type_id   SMALLINT     NOT NULL,
    code             VARCHAR(32)  NOT NULL,
    display_name     VARCHAR(64)  NOT NULL,
    description      TEXT         NULL,
    severity         SMALLINT     NOT NULL DEFAULT 2,
    color_hex        CHAR(7)      NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attack_type_id),
    UNIQUE KEY uq_attack_type_code (code),
    CONSTRAINT chk_attack_severity CHECK (severity BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO attack_type_catalog (attack_type_id, code, display_name, description, severity, color_hex) VALUES
    (1, 'sqli',      'SQL Injection',        'SQL keywords (union, select, drop, insert, etc.)', 5, '#f43f5e'),
    (2, 'xss',       'Cross-Site Scripting', 'Script/event-handler patterns (script, alert, onerror)', 4, '#fb7185'),
    (3, 'traversal', 'Path Traversal',       'Directory traversal (../, /etc/passwd, cmd.exe)', 4, '#fbbf24'),
    (4, 'encoded',   'Payload Encoded',      'URL-encoded obfuscation (%2f, %3c, %27, etc.)', 3, '#a78bfa'),
    (5, 'admin',     'Admin Probing',        'Admin/login/password/root probing patterns', 3, '#60a5fa'),
    (6, 'other',     'Otros',                'Anomalous without a specific indicator flag', 2, '#8b94ad');

CREATE TABLE IF NOT EXISTS request_events (
    event_id            CHAR(36)     NOT NULL DEFAULT (UUID()),
    event_code          VARCHAR(32)  NULL,
    detected_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    verdict             VARCHAR(20)  NOT NULL,
    action              VARCHAR(20)  NOT NULL DEFAULT 'allowed',
    confidence_score    DECIMAL(6,5) NULL,

    http_method         VARCHAR(10)  NOT NULL,
    uri                 TEXT         NOT NULL,
    host_header         VARCHAR(32)  NULL,
    `host`              VARCHAR(255) NULL,
    http_connection     VARCHAR(64)  NULL,
    accept_header       TEXT         NULL,
    accept_charset      TEXT         NULL,
    accept_language     TEXT         NULL,
    cache_control       VARCHAR(128) NULL,
    cookie              TEXT         NULL,
    pragma_header       VARCHAR(128) NULL,
    user_agent          TEXT         NULL,
    content_length      INT          NOT NULL DEFAULT 0,
    content_type        VARCHAR(128) NULL,
    post_data           TEXT         NULL,
    get_query           TEXT         NULL,

    request_headers     JSON         NULL,
    waf_rule            VARCHAR(32)  NULL,
    latency_ms          INT          NULL,

    primary_attack_type VARCHAR(32)  NULL,

    has_sql_kw          TINYINT      NOT NULL DEFAULT 0,
    has_xss_kw          TINYINT      NOT NULL DEFAULT 0,
    has_traversal       TINYINT      NOT NULL DEFAULT 0,
    has_encoded         TINYINT      NOT NULL DEFAULT 0,
    has_admin           TINYINT      NOT NULL DEFAULT 0,

    cnt_equal           INT          NOT NULL DEFAULT 0,
    cnt_ampersand       INT          NOT NULL DEFAULT 0,
    cnt_percent         INT          NOT NULL DEFAULT 0,
    cnt_slash           INT          NOT NULL DEFAULT 0,
    cnt_dot             INT          NOT NULL DEFAULT 0,
    cnt_quote           INT          NOT NULL DEFAULT 0,
    cnt_semicolon       INT          NOT NULL DEFAULT 0,
    cnt_comment         INT          NOT NULL DEFAULT 0,

    len_uri             INT          NOT NULL DEFAULT 0,
    len_get_query       INT          NOT NULL DEFAULT 0,
    len_post_data       INT          NOT NULL DEFAULT 0,
    len_cookie          INT          NOT NULL DEFAULT 0,
    len_user_agent      INT          NOT NULL DEFAULT 0,

    client_ip           VARCHAR(45)  NULL,
    client_country      CHAR(2)      NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (event_id),
    UNIQUE KEY uq_request_event_code (event_code),
    KEY idx_request_detected_at (detected_at),
    KEY idx_request_verdict (verdict),
    KEY idx_request_action (action),
    KEY idx_request_client_ip (client_ip),
    KEY idx_request_confidence (confidence_score),
    KEY idx_request_primary_type (primary_attack_type),
    CONSTRAINT fk_request_primary_type
        FOREIGN KEY (primary_attack_type) REFERENCES attack_type_catalog (code),
    CONSTRAINT chk_request_verdict CHECK (verdict IN ('valid', 'anomalous')),
    CONSTRAINT chk_request_action CHECK (action IN ('allowed', 'blocked', 'flagged'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_event_types (
    event_id         CHAR(36)  NOT NULL,
    attack_type_id   SMALLINT  NOT NULL,
    PRIMARY KEY (event_id, attack_type_id),
    KEY idx_event_types_attack (attack_type_id),
    CONSTRAINT fk_event_types_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_types_catalog
        FOREIGN KEY (attack_type_id) REFERENCES attack_type_catalog (attack_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_event_features (
    event_id       CHAR(36)       NOT NULL,
    feature_name   VARCHAR(64)    NOT NULL,
    feature_value  DECIMAL(12,4)  NOT NULL DEFAULT 0,
    contribution   DECIMAL(6,4)   NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, feature_name),
    CONSTRAINT fk_event_features_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE,
    CONSTRAINT chk_feature_contribution CHECK (contribution >= 0 AND contribution <= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS model_health_snapshots (
    snapshot_id            BIGINT       NOT NULL AUTO_INCREMENT,
    recorded_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    predictions_per_second INT          NOT NULL DEFAULT 0,
    rolling_accuracy       DECIMAL(6,5) NOT NULL DEFAULT 0,
    drift_score            DECIMAL(6,5) NOT NULL DEFAULT 0,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'healthy',
    PRIMARY KEY (snapshot_id),
    CONSTRAINT chk_model_status CHECK (status IN ('healthy', 'degraded', 'critical'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    user_id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER $$

CREATE TRIGGER before_request_event_insert
BEFORE INSERT ON request_events
FOR EACH ROW
BEGIN
    IF NEW.verdict <> 'anomalous' THEN
        SET NEW.primary_attack_type = NULL;
    ELSEIF NEW.has_sql_kw = 1 THEN
        SET NEW.primary_attack_type = 'sqli';
    ELSEIF NEW.has_xss_kw = 1 THEN
        SET NEW.primary_attack_type = 'xss';
    ELSEIF NEW.has_traversal = 1 THEN
        SET NEW.primary_attack_type = 'traversal';
    ELSEIF NEW.has_encoded = 1 THEN
        SET NEW.primary_attack_type = 'encoded';
    ELSEIF NEW.has_admin = 1 THEN
        SET NEW.primary_attack_type = 'admin';
    ELSE
        SET NEW.primary_attack_type = 'other';
    END IF;
END$$

CREATE TRIGGER after_request_event_insert
AFTER INSERT ON request_events
FOR EACH ROW
BEGIN
    IF NEW.verdict = 'anomalous' THEN
        IF NEW.has_sql_kw = 1 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 1);
        END IF;
        IF NEW.has_xss_kw = 1 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 2);
        END IF;
        IF NEW.has_traversal = 1 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 3);
        END IF;
        IF NEW.has_encoded = 1 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 4);
        END IF;
        IF NEW.has_admin = 1 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 5);
        END IF;
        IF NEW.has_sql_kw = 0 AND NEW.has_xss_kw = 0 AND NEW.has_traversal = 0
           AND NEW.has_encoded = 0 AND NEW.has_admin = 0 THEN
            INSERT INTO request_event_types (event_id, attack_type_id) VALUES (NEW.event_id, 6);
        END IF;
    END IF;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
    cur.total_requests,
    cur.blocked,
    ROUND(100.0 * cur.blocked / NULLIF(cur.total_requests, 0), 1) AS block_rate_pct,
    ROUND(100.0 * (cur.total_requests - IFNULL(prev.total_requests, 0))
        / NULLIF(prev.total_requests, 0), 1) AS total_requests_delta_pct,
    ROUND(100.0 * (cur.blocked - IFNULL(prev.blocked, 0))
        / NULLIF(prev.blocked, 0), 1) AS blocked_delta_pct,
    cur.unique_attackers,
    cur.avg_latency_ms,
    cur.p99_latency_ms,
    top_type.code AS top_attack_type_code,
    top_type.display_name AS top_attack_type_label,
    ROUND(100.0 * top_type.type_count / NULLIF(cur.blocked, 0), 0) AS top_attack_type_share_pct
FROM (
    SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN action = 'blocked' THEN 1 ELSE 0 END) AS blocked,
        COUNT(DISTINCT CASE WHEN client_ip IS NOT NULL AND verdict = 'anomalous' THEN client_ip END) AS unique_attackers,
        ROUND(AVG(latency_ms)) AS avg_latency_ms,
        (
            SELECT p.latency_ms
            FROM (
                SELECT
                    latency_ms,
                    ROW_NUMBER() OVER (ORDER BY latency_ms ASC) AS rn,
                    COUNT(*) OVER () AS cnt
                FROM request_events
                WHERE detected_at >= NOW() - INTERVAL 24 HOUR
                  AND latency_ms IS NOT NULL
            ) p
            WHERE p.rn = GREATEST(CEIL(p.cnt * 0.99), 1)
            LIMIT 1
        ) AS p99_latency_ms
    FROM request_events
    WHERE detected_at >= NOW() - INTERVAL 24 HOUR
) cur
LEFT JOIN (
    SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN action = 'blocked' THEN 1 ELSE 0 END) AS blocked
    FROM request_events
    WHERE detected_at >= NOW() - INTERVAL 48 HOUR
      AND detected_at <  NOW() - INTERVAL 24 HOUR
) prev ON 1 = 1
LEFT JOIN (
    SELECT
        re.primary_attack_type AS code,
        c.display_name,
        COUNT(*) AS type_count
    FROM request_events re
    JOIN attack_type_catalog c ON c.code = re.primary_attack_type
    WHERE re.detected_at >= NOW() - INTERVAL 24 HOUR
      AND re.verdict = 'anomalous'
    GROUP BY re.primary_attack_type, c.display_name
    ORDER BY type_count DESC
    LIMIT 1
) top_type ON 1 = 1;

CREATE OR REPLACE VIEW v_timeline_24h AS
SELECT
    DATE_FORMAT(h.hour_bucket, '%H:00') AS label,
    COALESCE(SUM(CASE WHEN re.verdict = 'valid' THEN 1 ELSE 0 END), 0) AS valid,
    COALESCE(SUM(CASE WHEN re.verdict = 'anomalous' THEN 1 ELSE 0 END), 0) AS anomalous
FROM (
    SELECT DATE_ADD(
        DATE_FORMAT(NOW() - INTERVAL 23 HOUR, '%Y-%m-%d %H:00:00'),
        INTERVAL hours.n HOUR
    ) AS hour_bucket
    FROM (
        SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL
        SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL
        SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL
        SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL
        SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
    ) hours
) h
LEFT JOIN request_events re
    ON DATE_FORMAT(re.detected_at, '%Y-%m-%d %H:00:00') = DATE_FORMAT(h.hour_bucket, '%Y-%m-%d %H:00:00')
GROUP BY h.hour_bucket
ORDER BY h.hour_bucket;

CREATE OR REPLACE VIEW v_attack_types_distribution AS
SELECT
    c.code AS id,
    c.display_name AS label,
    COUNT(DISTINCT ret.event_id) AS event_count,
    ROUND(
        100.0 * COUNT(DISTINCT ret.event_id) /
        NULLIF((
            SELECT COUNT(*)
            FROM request_events
            WHERE detected_at >= NOW() - INTERVAL 24 HOUR
              AND action = 'blocked'
        ), 0),
        0
    ) AS value,
    c.color_hex AS color
FROM attack_type_catalog c
LEFT JOIN request_event_types ret ON ret.attack_type_id = c.attack_type_id
LEFT JOIN request_events re ON re.event_id = ret.event_id
    AND re.detected_at >= NOW() - INTERVAL 24 HOUR
    AND re.action = 'blocked'
GROUP BY c.attack_type_id, c.code, c.display_name, c.color_hex
ORDER BY event_count DESC;

CREATE OR REPLACE VIEW v_top_ips AS
SELECT
    re.client_ip AS ip,
    IFNULL(re.client_country, '—') AS country,
    COUNT(*) AS total,
    ROUND(100.0 * SUM(CASE WHEN re.verdict = 'anomalous' THEN 1 ELSE 0 END) / COUNT(*), 0) AS anomalous_pct,
    DATE_FORMAT(MIN(re.detected_at), '%H:%i') AS first_seen,
    DATE_FORMAT(MAX(re.detected_at), '%H:%i') AS last_seen,
    CASE
        WHEN ROUND(100.0 * SUM(CASE WHEN re.verdict = 'anomalous' THEN 1 ELSE 0 END) / COUNT(*), 0) >= 75
            THEN 'blocked'
        ELSE 'watch'
    END AS status
FROM request_events re
WHERE re.detected_at >= NOW() - INTERVAL 24 HOUR
  AND re.client_ip IS NOT NULL
GROUP BY re.client_ip, re.client_country
ORDER BY total DESC
LIMIT 20;

CREATE OR REPLACE VIEW v_top_endpoints AS
SELECT
    re.uri AS uri,
    SUM(CASE WHEN re.verdict = 'anomalous' THEN 1 ELSE 0 END) AS attacks,
    COUNT(*) AS total
FROM request_events re
WHERE re.detected_at >= NOW() - INTERVAL 24 HOUR
GROUP BY re.uri
ORDER BY attacks DESC, total DESC
LIMIT 20;

CREATE OR REPLACE VIEW v_confidence_histogram AS
SELECT
    CASE
        WHEN confidence_score >= 0.0 AND confidence_score < 0.1 THEN '0.0-0.1'
        WHEN confidence_score >= 0.1 AND confidence_score < 0.2 THEN '0.1-0.2'
        WHEN confidence_score >= 0.2 AND confidence_score < 0.3 THEN '0.2-0.3'
        WHEN confidence_score >= 0.3 AND confidence_score < 0.4 THEN '0.3-0.4'
        WHEN confidence_score >= 0.4 AND confidence_score < 0.5 THEN '0.4-0.5'
        WHEN confidence_score >= 0.5 AND confidence_score < 0.6 THEN '0.5-0.6'
        WHEN confidence_score >= 0.6 AND confidence_score < 0.7 THEN '0.6-0.7'
        WHEN confidence_score >= 0.7 AND confidence_score < 0.8 THEN '0.7-0.8'
        WHEN confidence_score >= 0.8 AND confidence_score < 0.9 THEN '0.8-0.9'
        WHEN confidence_score >= 0.9 AND confidence_score <= 1.0 THEN '0.9-1.0'
    END AS bin,
    COUNT(*) AS count
FROM request_events
WHERE confidence_score IS NOT NULL
GROUP BY bin
ORDER BY MIN(confidence_score);

CREATE OR REPLACE VIEW v_model_health AS
SELECT
    m.predictions_per_second,
    m.rolling_accuracy,
    m.drift_score,
    m.status,
    m.recorded_at
FROM model_health_snapshots m
WHERE m.recorded_at = (SELECT MAX(recorded_at) FROM model_health_snapshots);

CREATE OR REPLACE VIEW v_user_profile AS
SELECT
    u.user_id,
    u.email,
    u.display_name AS name,
    u.created_at,
    u.updated_at
FROM users u;

CREATE OR REPLACE VIEW v_recent_events AS
SELECT
    IFNULL(re.event_code, CONCAT('evt-', REPLACE(re.event_id, '-', ''))) AS id,
    DATE_FORMAT(re.detected_at, '%H:%i:%s') AS ts,
    re.client_ip AS ip,
    re.http_method AS method,
    re.uri AS uri,
    re.verdict AS verdict,
    re.action AS action,
    re.confidence_score AS score,
    re.primary_attack_type AS attack_type,
    re.waf_rule AS rule,
    re.post_data AS body,
    IFNULL(
        re.request_headers,
        JSON_OBJECT(
            'Host', IFNULL(re.`host`, re.host_header),
            'User-Agent', re.user_agent,
            'Content-Type', re.content_type,
            'Content-Length', IF(re.content_length = 0, NULL, CAST(re.content_length AS CHAR)),
            'Cookie', re.cookie
        )
    ) AS headers,
    IFNULL((
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'name', f.feature_name,
                'value', f.feature_value,
                'contribution', f.contribution
            )
        )
        FROM request_event_features f
        WHERE f.event_id = re.event_id
    ), JSON_ARRAY()) AS features
FROM request_events re
ORDER BY re.detected_at DESC
LIMIT 200;

SET FOREIGN_KEY_CHECKS = 1;
