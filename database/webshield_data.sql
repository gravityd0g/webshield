-- WebShield schema aligned with webshield_rf_v1.joblib (42 features).
-- Model input columns: Method, URI, GET-Query, POST-Data, Cookie, User-Agent,
-- Content-Length, Host-Header (HTTP/1.0 | HTTP/1.1 in training data).
-- Model output: verdict (valid|anomalous), confidence_score (prob_anomalous), action (allowed|blocked).

DROP DATABASE IF EXISTS webshield;

CREATE DATABASE IF NOT EXISTS webshield
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE webshield;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Attack labels shown in the dashboard (mapped from triggered CRS flags in the API).
CREATE TABLE attack_type_catalog (
    attack_type_id   SMALLINT     NOT NULL,
    code             VARCHAR(32)  NOT NULL,
    display_name     VARCHAR(64)  NOT NULL,
    severity         SMALLINT     NOT NULL DEFAULT 2,
    color_hex        CHAR(7)      NULL,
    PRIMARY KEY (attack_type_id),
    UNIQUE KEY uq_attack_type_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO attack_type_catalog (attack_type_id, code, display_name, severity, color_hex) VALUES
    (1,  'sqli',      'SQL Injection',        5, '#f43f5e'),
    (2,  'xss',       'Cross-Site Scripting', 4, '#fb7185'),
    (3,  'traversal', 'Path Traversal',       4, '#fbbf24'),
    (4,  'encoded',   'Payload Encoded',      3, '#a78bfa'),
    (5,  'admin',     'Admin Probing',        3, '#60a5fa'),
    (6,  'rce',       'Remote Code Execution', 5, '#ef4444'),
    (7,  'lfi',       'Local File Inclusion',  5, '#f97316'),
    (8,  'nosql',     'NoSQL Injection',       4, '#a855f7'),
    (9,  'log4j',     'Log4Shell / JNDI',      5, '#dc2626'),
    (10, 'other',     'Otros',                 2, '#8b94ad');

-- One row per inspected HTTP request (model decision + metadata).
CREATE TABLE request_events (
    event_id            CHAR(36)     NOT NULL DEFAULT (UUID()),
    event_code          VARCHAR(32)  NULL,
    detected_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verdict             VARCHAR(20)  NOT NULL,
    action              VARCHAR(20)  NOT NULL DEFAULT 'allowed',
    confidence_score    DECIMAL(6,5) NULL,
    primary_attack_type VARCHAR(32)  NULL,
    client_ip           VARCHAR(45)  NULL,
    client_country      CHAR(2)      NULL,
    latency_ms          INT          NULL,
    model_version       VARCHAR(16)  NULL,
    PRIMARY KEY (event_id),
    UNIQUE KEY uq_request_event_code (event_code),
    KEY idx_request_detected_at (detected_at),
    KEY idx_request_verdict (verdict),
    KEY idx_request_action (action),
    KEY idx_request_client_ip (client_ip),
    KEY idx_request_primary_type (primary_attack_type),
    CONSTRAINT fk_request_primary_type
        FOREIGN KEY (primary_attack_type) REFERENCES attack_type_catalog (code),
    CONSTRAINT chk_request_verdict CHECK (verdict IN ('valid', 'anomalous')),
    CONSTRAINT chk_request_action CHECK (action IN ('allowed', 'blocked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Raw HTTP fields fed into build_features() / request_to_row().
CREATE TABLE request_http (
    event_id        CHAR(36)     NOT NULL,
    http_method     VARCHAR(10)  NOT NULL,
    uri             TEXT         NOT NULL,
    get_query       TEXT         NULL,
    post_data       TEXT         NULL,
    cookie          TEXT         NULL,
    user_agent      TEXT         NULL,
    content_length  INT          NOT NULL DEFAULT 0,
    host_header     VARCHAR(16)  NOT NULL DEFAULT 'HTTP/1.1',
    request_headers JSON         NULL,
    PRIMARY KEY (event_id),
    KEY idx_request_http_method (http_method),
    CONSTRAINT fk_request_http_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- All 42 features from webshield_rf_v1.joblib (values produced by build_features).
CREATE TABLE request_ml_features (
    event_id              CHAR(36)  NOT NULL,
    content_length        INT       NOT NULL DEFAULT 0,
    len_uri               INT       NOT NULL DEFAULT 0,
    len_get_query         INT       NOT NULL DEFAULT 0,
    len_post_data         INT       NOT NULL DEFAULT 0,
    len_cookie            INT       NOT NULL DEFAULT 0,
    len_user_agent        INT       NOT NULL DEFAULT 0,
    has_sql_kw            TINYINT   NOT NULL DEFAULT 0,
    has_xss_kw            TINYINT   NOT NULL DEFAULT 0,
    has_traversal         TINYINT   NOT NULL DEFAULT 0,
    has_encoded           TINYINT   NOT NULL DEFAULT 0,
    has_admin             TINYINT   NOT NULL DEFAULT 0,
    cnt_equal             INT       NOT NULL DEFAULT 0,
    cnt_ampersand         INT       NOT NULL DEFAULT 0,
    cnt_percent           INT       NOT NULL DEFAULT 0,
    cnt_slash             INT       NOT NULL DEFAULT 0,
    cnt_dot               INT       NOT NULL DEFAULT 0,
    cnt_quote             INT       NOT NULL DEFAULT 0,
    cnt_semicolon         INT       NOT NULL DEFAULT 0,
    cnt_comment           INT       NOT NULL DEFAULT 0,
    has_rce_kw            TINYINT   NOT NULL DEFAULT 0,
    has_lfi_kw            TINYINT   NOT NULL DEFAULT 0,
    has_rfi_kw            TINYINT   NOT NULL DEFAULT 0,
    has_php_attack        TINYINT   NOT NULL DEFAULT 0,
    has_xxe               TINYINT   NOT NULL DEFAULT 0,
    has_log4j             TINYINT   NOT NULL DEFAULT 0,
    has_nosql             TINYINT   NOT NULL DEFAULT 0,
    has_serialization     TINYINT   NOT NULL DEFAULT 0,
    has_xss_advanced      TINYINT   NOT NULL DEFAULT 0,
    has_sql_advanced      TINYINT   NOT NULL DEFAULT 0,
    has_sensitive_file    TINYINT   NOT NULL DEFAULT 0,
    has_admin_path        TINYINT   NOT NULL DEFAULT 0,
    has_shell_extension   TINYINT   NOT NULL DEFAULT 0,
    has_double_encoded    TINYINT   NOT NULL DEFAULT 0,
    has_null_byte         TINYINT   NOT NULL DEFAULT 0,
    ua_scanner            TINYINT   NOT NULL DEFAULT 0,
    ua_lib                TINYINT   NOT NULL DEFAULT 0,
    ua_browser            TINYINT   NOT NULL DEFAULT 0,
    ua_len                INT       NOT NULL DEFAULT 0,
    ua_word_count         INT       NOT NULL DEFAULT 0,
    method_post           TINYINT   NOT NULL DEFAULT 0,
    method_put            TINYINT   NOT NULL DEFAULT 0,
    host_header_http_1_1  TINYINT   NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id),
    CONSTRAINT fk_request_ml_features_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Top triggered features for the event drawer (name + value; contribution optional).
CREATE TABLE request_event_features (
    event_id       CHAR(36)       NOT NULL,
    feature_name   VARCHAR(64)    NOT NULL,
    feature_value  DECIMAL(12,4)  NOT NULL DEFAULT 0,
    contribution   DECIMAL(6,4)   NULL,
    PRIMARY KEY (event_id, feature_name),
    CONSTRAINT fk_event_features_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE model_health_snapshots (
    snapshot_id            BIGINT       NOT NULL AUTO_INCREMENT,
    recorded_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    predictions_per_second INT          NOT NULL DEFAULT 0,
    rolling_accuracy       DECIMAL(6,5) NOT NULL DEFAULT 0,
    drift_score            DECIMAL(6,5) NOT NULL DEFAULT 0,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'healthy',
    model_version          VARCHAR(16)  NULL,
    PRIMARY KEY (snapshot_id),
    CONSTRAINT chk_model_status CHECK (status IN ('healthy', 'degraded', 'critical'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    user_id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
