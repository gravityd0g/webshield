const jwt = require('jsonwebtoken');
const SECRET = 'recetario_secret_2024';

function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Debes iniciar sesión' });
  const token = auth.split(' ')[1];
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión expirada, vuelve a iniciar sesión' });
  }
}

function tokenOpcional(req, res, next) {
  const auth = req.headers['authorization'];
  if (auth) {
    try { req.usuario = jwt.verify(auth.split(' ')[1], SECRET); } catch {}
  }
  next();
}

module.exports = { verificarToken, tokenOpcional, SECRET };
