# -*- coding: utf-8 -*-
"""WebShield feature engineering — RF + OWASP CRS extended.

Binary classification of HTTP requests as Valid (0) vs Anomalous (1).

Issue #4 — Añadir reglas al modelo de AI: usar OWASP CRS para sumar más reglas
como columnas del feature set.

OWASP CRS references:
- https://owasp.org/www-project-modsecurity-core-rule-set/
- https://github.com/coreruleset/coreruleset/tree/main/rules

Feature groups in webshield_rf_v1.joblib (42 total):
1. Baseline (19) — Content-Length, len_*, indicadores OWASP básicos, cnt_*.
2. Banderas CRS (15) — RCE, LFI, RFI, PHP, XXE, log4j, NoSQL, serialización,
   XSS/SQLi expandidos, archivos sensibles, paths admin, double encoding, null byte.
3. User-Agent fingerprinting (5) — scanners, librerías HTTP, navegadores, ua_len,
   ua_word_count (CRS 913).
4. Categóricas (3) — Method_POST, Method_PUT, Host-Header_HTTP/1.1.

x = features del request HTTP; y = 0 valid, 1 anomalous.
"""

import pandas as pd

ATTACK_TEXT_COLS = ["URI", "GET-Query", "POST-Data", "Cookie", "User-Agent"]


def _request_text(df: pd.DataFrame) -> pd.Series:
    """Texto concatenado de la request para features basadas en regex."""
    return (
        df[ATTACK_TEXT_COLS]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
        .str.lower()
    )


def build_features(df, feature_names=None):
    # Create numeric features from the text of the HTTP requests.
    x = pd.DataFrame(index=df.index)

    # Original numeric variable
    x["Content-Length"] = pd.to_numeric(
        df["Content-Length"], errors="coerce"
    ).fillna(0)

    # Columns where web attacks usually appear
    # Length of each text field, because attack requests are usually abnormally long.
    for col in ATTACK_TEXT_COLS:
        new_col = "len_" + col.replace("-", "_")
        x[new_col] = df[col].astype(str).str.len()

    # Concatenated request text for regex-based features
    request_text = _request_text(df)

    # === Baseline OWASP CRS indicators (notebook original) ===

    x["has_sql_kw"] = request_text.str.contains(
        r"\b(?:union|select|drop|insert|delete|update|where|from)\b",
        regex=True,
    ).astype(int)

    x["has_xss_kw"] = request_text.str.contains(
        r"script|javascript|onload|onerror|alert|iframe",
        regex=True,
    ).astype(int)

    x["has_traversal"] = request_text.str.contains(
        r"\.\./|\.\.\\|/etc/passwd|cmd\.exe|winnt|boot\.ini",
        regex=True,
    ).astype(int)

    x["has_encoded"] = request_text.str.contains(
        r"%2f|%3c|%3e|%27|%22|%28|%29",
        regex=True,
    ).astype(int)

    x["has_admin"] = request_text.str.contains(
        r"admin|login|password|passwd|root",
        regex=True,
    ).astype(int)

    # Counts of symbols frequently seen in web attacks
    x["cnt_equal"] = request_text.str.count(r"=")
    x["cnt_ampersand"] = request_text.str.count(r"&")
    x["cnt_percent"] = request_text.str.count(r"%")
    x["cnt_slash"] = request_text.str.count(r"/")
    x["cnt_dot"] = request_text.str.count(r"\.")
    x["cnt_quote"] = request_text.str.count(r"'") + request_text.str.count(r'"')
    x["cnt_semicolon"] = request_text.str.count(r";")
    x["cnt_comment"] = request_text.str.count(r"--")

    # === Grupo 1 — banderas de categorías de ataque (OWASP CRS) ===
    # 15 features binarias inspiradas en las reglas determinísticas del Core Rule Set.

    # CRS 932 — Remote Code Execution
    x["has_rce_kw"] = request_text.str.contains(
        r"\b(?:eval|exec|system|passthru|shell_exec|popen|proc_open|assert|create_function)\b|"
        r"\$\(|`[^`]+`|"
        r";\s*(?:cat|ls|whoami|id|uname|ps|wget|curl|nc|ncat|telnet|chmod|rm)\b|"
        r"\|\s*(?:cat|ls|whoami|id|uname|ps|wget|curl|nc|ncat)\b|"
        r"&&\s*(?:cat|ls|whoami|id|uname)|"
        r"/bin/(?:sh|bash|dash|csh|tcsh|zsh)|/usr/bin/|/usr/local/bin/",
        regex=True,
    ).astype(int)

    # CRS 930 — Local File Inclusion
    x["has_lfi_kw"] = request_text.str.contains(
        r"/etc/(?:passwd|shadow|hosts|group|sudoers|nginx|apache)|"
        r"/proc/self/|/proc/version|/proc/cpuinfo|"
        r"php://(?:filter|input|memory|fd)|"
        r"file://|expect://|data:text",
        regex=True,
    ).astype(int)

    # CRS 931 — Remote File Inclusion
    x["has_rfi_kw"] = request_text.str.contains(
        r"=https?://|=ftp://|file=https?://|include=https?://|page=https?://",
        regex=True,
    ).astype(int)

    # CRS 933 — PHP attacks
    x["has_php_attack"] = request_text.str.contains(
        r"<\?php|<\?=|"
        r"\$_(?:get|post|request|cookie|server|env|files|session|globals)|"
        r"base64_decode|gzinflate|str_rot13|"
        r"preg_replace.*?/e|php://",
        regex=True,
    ).astype(int)

    # XXE — XML External Entity
    x["has_xxe"] = request_text.str.contains(
        r"<!entity|<!doctype[^>]*\[|system\s+[\"']file:|system\s+[\"']http:",
        regex=True,
    ).astype(int)

    # CRS 944 — Log4Shell / JNDI injection
    x["has_log4j"] = request_text.str.contains(
        r"\$\{jndi:|\$\{lower:|\$\{upper:|"
        r"ldap://|ldaps://|rmi://|nis://|nds://|iiop://|corba://|dns://",
        regex=True,
    ).astype(int)

    # NoSQL injection
    x["has_nosql"] = request_text.str.contains(
        r"\$ne\b|\$gt\b|\$lt\b|\$gte\b|\$lte\b|\$in\b|\$nin\b|"
        r"\$or\b|\$and\b|\$where\b|\$regex\b|\$exists\b|"
        r"db\.[a-z_]+\.(?:drop|find|update|remove|delete|insert)",
        regex=True,
    ).astype(int)

    # PHP serialized objects (deserialization attacks)
    x["has_serialization"] = request_text.str.contains(
        r'o:\d+:"|a:\d+:{\d+:|s:\d+:"|i:\d+;|b:[01];',
        regex=True,
    ).astype(int)

    # CRS 941 — XSS expanded
    x["has_xss_advanced"] = request_text.str.contains(
        r"on(?:load|error|mouseover|focus|click|keyup|submit|change|blur)\s*=|"
        r"javascript:|data:text/html|vbscript:|"
        r"<svg|<iframe|<embed|<object|"
        r"alert\(|prompt\(|confirm\(|"
        r"document\.cookie|document\.write|window\.location",
        regex=True,
    ).astype(int)

    # CRS 942 — SQLi expanded
    x["has_sql_advanced"] = request_text.str.contains(
        r"union\s+(?:all\s+)?select|"
        r"information_schema|"
        r"\bsleep\s*\(|benchmark\s*\(|waitfor\s+delay|"
        r"\bchar\s*\(\s*\d+|\bascii\s*\(|substr(?:ing)?\s*\(|"
        r"or\s+\d+\s*=\s*\d+|or\s+[\"']\w+[\"']\s*=\s*[\"']\w+[\"']|"
        r"--[ \t]|/\*.*?\*/|#\s",
        regex=True,
    ).astype(int)

    # Sensitive file probing
    x["has_sensitive_file"] = request_text.str.contains(
        r"\.git/|\.env\b|\.htaccess|\.htpasswd|"
        r"\.bak\b|\.backup\b|\.old\b|\.orig\b|\.swp\b|\.swo\b|"
        r"web\.config|wp-config\.php|configuration\.php|"
        r"\.ds_store|\.ssh/|id_rsa|\.pem\b|\.key\b|"
        r"/.well-known/",
        regex=True,
    ).astype(int)

    # Admin/management paths probing
    x["has_admin_path"] = request_text.str.contains(
        r"/admin|/administrator|/wp-admin|/wp-login|"
        r"/phpmyadmin|/pma\b|/myadmin|/dbadmin|/sqladmin|"
        r"/manager|/console|/dashboard|/cpanel|"
        r"/_admin|/sysadmin|/adminer|/setup\.php|/install\.php",
        regex=True,
    ).astype(int)

    # Suspicious script extensions
    x["has_shell_extension"] = request_text.str.contains(
        r"\.(?:sh|pl|py|rb|jsp|asp|aspx|cgi|cmd|bat|war|jar)(?:[?\b/]|$)",
        regex=True,
    ).astype(int)

    # Double URL encoding (evasion)
    x["has_double_encoded"] = request_text.str.contains(
        r"%25(?:3c|3e|22|27|28|29|2f|5c|3d|26|2e)",
        regex=True,
    ).astype(int)

    # Null byte injection
    x["has_null_byte"] = request_text.str.contains(
        r"%00|\\x00|\\u0000",
        regex=True,
    ).astype(int)

    # === Grupo 2 — User-Agent fingerprinting (CRS 913) ===
    # Detección de scanners, librerías HTTP automatizadas y navegadores reales.

    ua = df["User-Agent"].fillna("").astype(str).str.lower()

    # Scanners y herramientas ofensivas conocidas
    x["ua_scanner"] = ua.str.contains(
        r"nikto|sqlmap|nmap|w3af|burp|acunetix|nessus|openvas|"
        r"masscan|fimap|wfuzz|skipfish|nuclei|httpx|"
        r"dirb|gobuster|wpscan|hydra|metasploit",
        regex=True,
    ).astype(int)

    # Librerías HTTP (clientes automatizados, potenciales bots)
    x["ua_lib"] = ua.str.contains(
        r"curl/|wget/|python-requests|python-urllib|libcurl|"
        r"java/|go-http-client|okhttp|apache-httpclient|node-fetch",
        regex=True,
    ).astype(int)

    # Navegadores reales (señal de tráfico humano legítimo)
    x["ua_browser"] = ua.str.contains(
        r"mozilla/|applewebkit|chrome/|firefox/|safari/|edge/|opera/",
        regex=True,
    ).astype(int)

    x["ua_len"] = ua.str.len()
    x["ua_word_count"] = ua.str.split().str.len().fillna(0)

    # === Categóricas + ensamble final ===
    # Categorical variables with low cardinality
    x_cat = pd.get_dummies(
        df[["Method", "Host-Header"]],
        drop_first=True,
        dtype=int,
    )

    # Join numeric and categorical variables
    x = pd.concat([x, x_cat], axis=1)

    # Ensure there are no null values
    x = x.fillna(0)

    # Muy importante: alinear columnas con las del entrenamiento
    if feature_names is not None:
        x = x.reindex(columns=feature_names, fill_value=0)

    return x
