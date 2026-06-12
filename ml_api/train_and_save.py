"""Train a RandomForest (re-using notebook preprocessing) and save to model.joblib.

Usage:
  python train_and_save.py /path/to/ecml_pkdd_2007_web_attacks.csv

If run without an argument the script will exit with a message.
"""
import sys
import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split


def build_features(df):
    x = pd.DataFrame(index=df.index)
    x['Content-Length'] = pd.to_numeric(df.get('Content-Length', 0), errors='coerce').fillna(0)
    attack_text_cols = ['URI', 'GET-Query', 'POST-Data', 'Cookie', 'User-Agent']
    for col in attack_text_cols:
        new_col = 'len_' + col.replace('-', '_')
        x[new_col] = df[col].astype(str).str.len()

    request_text = df[attack_text_cols].astype(str).agg(' '.join, axis=1).str.lower()

    x['has_sql_kw'] = request_text.str.contains(r"\b(?:union|select|drop|insert|delete|update|where|from)\b", regex=True).astype(int)
    x['has_xss_kw'] = request_text.str.contains(r"script|javascript|onload|onerror|alert|iframe", regex=True).astype(int)
    x['has_traversal'] = request_text.str.contains(r"\.\./|\.\.\\|/etc/passwd|cmd\.exe|winnt|boot\.ini", regex=True).astype(int)
    x['has_encoded'] = request_text.str.contains(r"%2f|%3c|%3e|%27|%22|%28|%29", regex=True).astype(int)
    x['has_admin'] = request_text.str.contains(r"admin|login|password|passwd|root", regex=True).astype(int)

    x['cnt_equal'] = request_text.str.count(r"=")
    x['cnt_ampersand'] = request_text.str.count(r"&")
    x['cnt_percent'] = request_text.str.count(r"%")
    x['cnt_slash'] = request_text.str.count(r"/")
    x['cnt_dot'] = request_text.str.count(r"\.")
    x['cnt_quote'] = request_text.str.count("'") + request_text.str.count('"')
    x['cnt_semicolon'] = request_text.str.count(r";")
    x['cnt_comment'] = request_text.str.count(r"--")

    # Categorical columns handling (simple): Method dummies
    x['Method_POST'] = (df.get('Method', '').astype(str).str.upper() == 'POST').astype(int)
    x['Method_GET'] = (df.get('Method', '').astype(str).str.upper() == 'GET').astype(int)

    x = x.fillna(0)
    return x


def main():
    if len(sys.argv) < 2:
        print('Usage: python train_and_save.py /path/to/ecml_pkdd_2007_web_attacks.csv')
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print('CSV file not found:', csv_path)
        sys.exit(1)

    df = pd.read_csv(csv_path)
    df = df.drop(columns=[c for c in ['Host', 'Content-Type'] if c in df.columns], errors='ignore')
    df['Class'] = df['Class'].str.lower()
    df = df[df['Class'].isin(['valid', 'anomalous'])].copy()

    y = df['Class'].map({'valid': 0, 'anomalous': 1}).astype(int)
    X = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=10)

    clf = RandomForestClassifier(n_estimators=100, random_state=10)
    clf.fit(X_train, y_train)

    out_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
    joblib.dump(clf, out_path)
    print('Model saved to', out_path)


if __name__ == '__main__':
    main()
