from flask import Flask, request, jsonify
import os
import re
import joblib
import pandas as pd

APP_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(APP_DIR, 'model.joblib')

app = Flask(__name__)


def load_model():
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception:
            return None
    return None


def extract_features(payload):
    # Expecting keys similar to the training script: Method, URI, GET-Query, POST-Data, Cookie, User-Agent, Content-Length, Host-Header
    method = (payload.get('Method') or '').upper()
    uri = payload.get('URI') or ''
    getq = payload.get('GET-Query') or ''
    post = payload.get('POST-Data') or ''
    cookie = payload.get('Cookie') or ''
    ua = payload.get('User-Agent') or ''
    cl = payload.get('Content-Length')

    try:
        clv = int(cl) if cl is not None else 0
    except Exception:
        clv = 0

    text_fields = ' '.join([str(uri), str(getq), str(post), str(cookie), str(ua)]).lower()

    features = {}
    features['Content-Length'] = clv
    for col_name, text in [('URI', uri), ('GET-Query', getq), ('POST-Data', post), ('Cookie', cookie), ('User-Agent', ua)]:
        cname = 'len_' + col_name.replace('-', '_')
        features[cname] = len(str(text))

    features['has_sql_kw'] = int(bool(re.search(r"\b(?:union|select|drop|insert|delete|update|where|from)\b", text_fields)))
    features['has_xss_kw'] = int(bool(re.search(r"script|javascript|onload|onerror|alert|iframe", text_fields)))
    features['has_traversal'] = int(bool(re.search(r"\.\./|\.\.\\|/etc/passwd|cmd\\.exe|winnt|boot\\.ini", text_fields)))
    features['has_encoded'] = int(bool(re.search(r"%2f|%3c|%3e|%27|%22|%28|%29", text_fields)))
    features['has_admin'] = int(bool(re.search(r"admin|login|password|passwd|root", text_fields)))

    features['cnt_equal'] = text_fields.count('=')
    features['cnt_ampersand'] = text_fields.count('&')
    features['cnt_percent'] = text_fields.count('%')
    features['cnt_slash'] = text_fields.count('/')
    features['cnt_dot'] = text_fields.count('.')
    features['cnt_quote'] = text_fields.count("'") + text_fields.count('"')
    features['cnt_semicolon'] = text_fields.count(';')
    features['cnt_comment'] = text_fields.count('--')

    # Simple method dummies (best-effort)
    features['Method_POST'] = 1 if method == 'POST' else 0
    features['Method_GET'] = 1 if method == 'GET' else 0

    return features


def heuristic_score(features):
    # Lightweight heuristic fallback so API is usable without a trained model.
    score = 0.0
    score += 0.35 * features.get('has_sql_kw', 0)
    score += 0.25 * features.get('has_xss_kw', 0)
    score += 0.20 * features.get('has_traversal', 0)
    score += 0.10 * (min(features.get('cnt_percent', 0) / 10.0, 1.0))
    score += 0.10 * (min(features.get('cnt_quote', 0) / 6.0, 1.0))
    return min(max(score, 0.0), 1.0)


@app.route('/predict', methods=['POST'])
def predict():
    payload = request.get_json() or {}
    features = extract_features(payload)

    model = load_model()
    df = pd.DataFrame([features])

    if model is not None:
        try:
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(df)[0]
                # pick probability for class 1 (anomalous) if available
                try:
                    idx = list(model.classes_).index(1)
                    score = float(proba[idx])
                except Exception:
                    score = float(proba[-1])
            else:
                pred = model.predict(df)[0]
                score = 1.0 if int(pred) == 1 else 0.0
        except Exception:
            score = heuristic_score(features)
    else:
        score = heuristic_score(features)

    verdict = 'anomalous' if score >= 0.5 else 'valid'
    action = 'blocked' if verdict == 'anomalous' else 'allowed'

    contributions = []
    total = 0.0
    for k, v in features.items():
        contrib = float(v) if isinstance(v, (int, float)) else 0.0
        contributions.append({'name': k, 'value': v, 'contribution': contrib})
        total += abs(contrib)
    if total > 0:
        for c in contributions:
            c['contribution'] = round(abs(c['contribution']) / total, 4)

    resp = {
        'score': round(float(score), 4),
        'verdict': verdict,
        'action': action,
        'attackType': None,
        'features': contributions,
    }

    return jsonify(resp)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
