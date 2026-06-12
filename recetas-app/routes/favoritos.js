const router = require('express').Router();
const { pool } = require('../db');
const { verificarToken } = require('../middleware/auth');

// Mis favoritos
router.get('/', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.nombre as autor,
        cat.nombre as categoria_nombre, cat.icono as categoria_icono,
        (SELECT ROUND(AVG(calificacion),1) FROM comentarios c WHERE c.receta_id = r.id) as calificacion_promedio
      FROM favoritos f
      JOIN recetas r ON r.id = f.receta_id
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN categorias cat ON cat.id = r.categoria_id
      WHERE f.usuario_id = ?
      ORDER BY f.creado_en DESC`, [req.usuario.id]);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
});

// Agregar favorito
router.post('/:receta_id', verificarToken, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO favoritos (usuario_id, receta_id) VALUES (?,?) ON DUPLICATE KEY UPDATE creado_en=creado_en',
      [req.usuario.id, req.params.receta_id]
    );
    res.json({ agregado: true });
  } catch {
    res.status(500).json({ error: 'Error al agregar favorito' });
  }
});

// Quitar favorito
router.delete('/:receta_id', verificarToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM favoritos WHERE usuario_id=? AND receta_id=?',
      [req.usuario.id, req.params.receta_id]);
    res.json({ eliminado: true });
  } catch {
    res.status(500).json({ error: 'Error al quitar favorito' });
  }
});

module.exports = router;
