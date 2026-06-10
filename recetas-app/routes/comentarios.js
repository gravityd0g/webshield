const router = require('express').Router();
const { pool } = require('../db');
const { verificarToken } = require('../middleware/auth');

// Comentarios de una receta
router.get('/:receta_id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.nombre as autor
      FROM comentarios c
      JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.receta_id = ?
      ORDER BY c.creado_en DESC`, [req.params.receta_id]);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// Agregar comentario
router.post('/:receta_id', verificarToken, async (req, res) => {
  const { contenido, calificacion } = req.body;
  if (!contenido?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });

  try {
    const [result] = await pool.query(
      'INSERT INTO comentarios (usuario_id, receta_id, contenido, calificacion) VALUES (?,?,?,?)',
      [req.usuario.id, req.params.receta_id, contenido.trim(), calificacion || null]
    );
    const [rows] = await pool.query(`
      SELECT c.*, u.username, u.nombre as autor
      FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al guardar el comentario' });
  }
});

// Eliminar comentario (solo el autor)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT usuario_id FROM comentarios WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ error: 'No puedes eliminar este comentario' });
    await pool.query('DELETE FROM comentarios WHERE id=?', [req.params.id]);
    res.json({ eliminado: true });
  } catch {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
