DROP DATABASE IF EXISTS webshield;
CREATE DATABASE IF NOT EXISTS webshield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE webshield;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE request_events (
    event_id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    detected_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    verdict           VARCHAR(20)  NOT NULL,
    action            VARCHAR(20)  NOT NULL DEFAULT 'allowed',
    confidence_score  DECIMAL(6,5) NULL,
    client_ip         VARCHAR(45)  NULL,
    latency_ms        INT          NULL,
    model_version     VARCHAR(16)  NULL,
    PRIMARY KEY (event_id),
    KEY idx_request_detected_at (detected_at),
    KEY idx_request_verdict (verdict),
    KEY idx_request_action (action),
    KEY idx_request_client_ip (client_ip),
    CONSTRAINT chk_request_verdict CHECK (verdict IN ('valid','anomalous')),
    CONSTRAINT chk_request_action  CHECK (action  IN ('allowed','blocked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE request_http (
    event_id         CHAR(36)     NOT NULL,
    http_method      VARCHAR(10)  NOT NULL,
    uri              TEXT         NOT NULL,
    get_query        TEXT         NULL,
    post_data        TEXT         NULL,
    cookie           TEXT         NULL,
    user_agent       TEXT         NULL,
    content_length   INT          NOT NULL DEFAULT 0,
    host_header      VARCHAR(16)  NOT NULL DEFAULT 'HTTP/1.1',
    request_headers  JSON         NULL,
    PRIMARY KEY (event_id),
    KEY idx_request_http_method (http_method),
    CONSTRAINT fk_request_http_event
        FOREIGN KEY (event_id) REFERENCES request_events (event_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
    user_id        CHAR(36)     NOT NULL DEFAULT (UUID()),
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    display_name   VARCHAR(128) NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
