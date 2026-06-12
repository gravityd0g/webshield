const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { SECRET } = require('../middleware/auth');

router.post('/registro', async (req, res) => {
  const { username, email, password, nombre } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos' });

  try {
    const [existe] = await pool.query(
      'SELECT id FROM usuarios WHERE username=? OR email=?', [username, email]
    );
    if (existe.length) return res.status(409).json({ error: 'El usuario o email ya está registrado' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, email, password, nombre) VALUES (?,?,?,?)',
      [username, email, hash, nombre || null]
    );
    const token = jwt.sign({ id: result.insertId, username }, SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, username, nombre: nombre || username });
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username=? OR email=?', [username, username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username, nombre: user.nombre || user.username });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/perfil', async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autenticado' });
  try {
    const { id } = jwt.verify(auth.split(' ')[1], SECRET);
    const [rows] = await pool.query(
      'SELECT id, username, email, nombre, bio, creado_en FROM usuarios WHERE id=?', [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

router.put('/perfil', async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autenticado' });
  try {
    const { id } = jwt.verify(auth.split(' ')[1], SECRET);
    const { nombre, bio } = req.body;
    await pool.query('UPDATE usuarios SET nombre=?, bio=? WHERE id=?', [nombre, bio, id]);
    res.json({ mensaje: 'Perfil actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

module.exports = router;
