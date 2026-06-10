import pandas as pd

def build_features(df, feature_names=None):
    x = pd.DataFrame(index=df.index)

    x["Content-Length"] = pd.to_numeric(
        df["Content-Length"], errors="coerce"
    ).fillna(0)

    attack_text_cols = ["URI", "GET-Query", "POST-Data", "Cookie", "User-Agent"]

    for col in attack_text_cols:
        new_col = "len_" + col.replace("-", "_")
        x[new_col] = df[col].astype(str).str.len()

    request_text = (
        df[attack_text_cols]
        .fillna("")
        .astype(str)
        .agg(" ".join, axis=1)
        .str.lower()
    )

    x["has_sql_kw"] = request_text.str.contains(
        r"\b(?:union|select|drop|insert|delete|update|where|from)\b",
        regex=True
    ).astype(int)

    x["has_xss_kw"] = request_text.str.contains(
        r"script|javascript|onload|onerror|alert|iframe",
        regex=True
    ).astype(int)

    x["has_traversal"] = request_text.str.contains(
        r"\.\./|\.\.\\|/etc/passwd|cmd\.exe|winnt|boot\.ini",
        regex=True
    ).astype(int)

    x["has_encoded"] = request_text.str.contains(
        r"%2f|%3c|%3e|%27|%22|%28|%29",
        regex=True
    ).astype(int)

    x["has_admin"] = request_text.str.contains(
        r"admin|login|password|passwd|root",
        regex=True
    ).astype(int)

    x["cnt_equal"] = request_text.str.count(r"=")
    x["cnt_ampersand"] = request_text.str.count(r"&")
    x["cnt_percent"] = request_text.str.count(r"%")
    x["cnt_slash"] = request_text.str.count(r"/")
    x["cnt_dot"] = request_text.str.count(r"\.")
    x["cnt_quote"] = request_text.str.count(r"'") + request_text.str.count(r'"')
    x["cnt_semicolon"] = request_text.str.count(r";")
    x["cnt_comment"] = request_text.str.count(r"--")

    # Aquí debes copiar también las features CRS extendidas:
    # has_rce_kw, has_lfi_kw, has_rfi_kw, has_php_attack,
    # has_xxe, has_log4j, has_nosql, has_serialization,
    # has_xss_advanced, has_sql_advanced, has_sensitive_file,
    # has_admin_path, has_shell_extension, has_double_encoded,
    # has_null_byte, ua_scanner, ua_lib, ua_browser, ua_len,
    # ua_word_count, etc.

    x_cat = pd.get_dummies(
        df[["Method", "Host-Header"]],
        drop_first=True,
        dtype=int
    )

    x = pd.concat([x, x_cat], axis=1)
    x = x.fillna(0)

    # Muy importante: alinear columnas con las del entrenamiento
    if feature_names is not None:
        x = x.reindex(columns=feature_names, fill_value=0)

    return x