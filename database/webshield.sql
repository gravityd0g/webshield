DROP DATABASE IF EXISTS webshield;

CREATE DATABASE IF NOT EXISTS webshield
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE webshield;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
    (1, 'sqli',      'SQL Injection',        5, '#f43f5e'),
    (2, 'xss',       'Cross-Site Scripting', 4, '#fb7185'),
    (3, 'traversal', 'Path Traversal',       4, '#fbbf24'),
    (4, 'encoded',   'Payload Encoded',      3, '#a78bfa'),
    (5, 'admin',     'Admin Probing',        3, '#60a5fa'),
    (6, 'other',     'Otros',                2, '#8b94ad');

CREATE TABLE request_events (
    event_id            CHAR(36)     NOT NULL DEFAULT (UUID()),
    event_code          VARCHAR(32)  NULL,
    detected_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verdict             VARCHAR(20)  NOT NULL,
    action              VARCHAR(20)  NOT NULL DEFAULT 'allowed',
    confidence_score    DECIMAL(6,5) NULL,
    primary_attack_type VARCHAR(32)  NULL,
    waf_rule            VARCHAR(32)  NULL,
    latency_ms          INT          NULL,
    client_ip           VARCHAR(45)  NULL,
    client_country      CHAR(2)      NULL,
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
    CONSTRAINT chk_request_action CHECK (action IN ('allowed', 'blocked', 'flagged'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE request_http (
    event_id        CHAR(36)     NOT NULL,
    http_method     VARCHAR(10)  NOT NULL,
    uri             TEXT         NOT NULL,
    user_agent      TEXT         NULL,
    post_data       TEXT         NULL,
    get_query       TEXT         NULL,
    request_headers JSON         NULL,
    PRIMARY KEY (event_id),
    KEY idx_request_http_method (http_method),
    CONSTRAINT fk_request_http_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE request_event_features (
    event_id       CHAR(36)       NOT NULL,
    feature_name   VARCHAR(64)    NOT NULL,
    feature_value  DECIMAL(12,4)  NOT NULL DEFAULT 0,
    contribution   DECIMAL(6,4)   NOT NULL DEFAULT 0,
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
