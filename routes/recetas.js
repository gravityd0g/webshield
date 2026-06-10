const router = require('express').Router();
const { pool } = require('../db');
const { verificarToken, tokenOpcional } = require('../middleware/auth');

// Listar recetas con filtros
router.get('/', tokenOpcional, async (req, res) => {
  const { categoria, buscar, dificultad, orden } = req.query;
  let sql = `
    SELECT r.*, u.username, u.nombre as autor,
      cat.nombre as categoria_nombre, cat.icono as categoria_icono,
      (SELECT COUNT(*) FROM favoritos f WHERE f.receta_id = r.id) as total_favoritos,
      (SELECT ROUND(AVG(calificacion),1) FROM comentarios c WHERE c.receta_id = r.id) as calificacion_promedio
    FROM recetas r
    JOIN usuarios u ON u.id = r.usuario_id
    LEFT JOIN categorias cat ON cat.id = r.categoria_id
    WHERE 1=1
  `;
  const params = [];

  if (categoria) { sql += ' AND r.categoria_id = ?'; params.push(categoria); }
  if (dificultad) { sql += ' AND r.dificultad = ?'; params.push(dificultad); }
  if (buscar) {
    sql += ' AND (r.titulo LIKE ? OR r.descripcion LIKE ?)';
    params.push(`%${buscar}%`, `%${buscar}%`);
  }

  const ordenMap = {
    recientes: 'r.creado_en DESC',
    populares: 'total_favoritos DESC',
    rapidas: '(r.tiempo_prep + r.tiempo_coccion) ASC',
    calificacion: 'calificacion_promedio DESC'
  };
  sql += ` ORDER BY ${ordenMap[orden] || 'r.creado_en DESC'}`;

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
});

// Detalle de una receta
router.get('/:id', tokenOpcional, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.nombre as autor, u.bio as autor_bio,
        cat.nombre as categoria_nombre, cat.icono as categoria_icono,
        (SELECT COUNT(*) FROM favoritos f WHERE f.receta_id = r.id) as total_favoritos,
        (SELECT ROUND(AVG(calificacion),1) FROM comentarios c WHERE c.receta_id = r.id) as calificacion_promedio,
        (SELECT COUNT(*) FROM comentarios c WHERE c.receta_id = r.id) as total_comentarios
      FROM recetas r
      JOIN usuarios u ON u.id = r.usuario_id
      LEFT JOIN categorias cat ON cat.id = r.categoria_id
      WHERE r.id = ?`, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Receta no encontrada' });
    const receta = rows[0];

    const [ingredientes] = await pool.query(
      'SELECT * FROM ingredientes WHERE receta_id=? ORDER BY id', [receta.id]);
    const [pasos] = await pool.query(
      'SELECT * FROM pasos WHERE receta_id=? ORDER BY numero', [receta.id]);
    const [comentarios] = await pool.query(`
      SELECT c.*, u.username, u.nombre as autor
      FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.receta_id=? ORDER BY c.creado_en DESC`, [receta.id]);

    let esFavorito = false;
    if (req.usuario) {
      const [fav] = await pool.query(
        'SELECT 1 FROM favoritos WHERE usuario_id=? AND receta_id=?',
        [req.usuario.id, receta.id]);
      esFavorito = fav.length > 0;
    }

    res.json({ ...receta, ingredientes, pasos, comentarios, esFavorito });
  } catch {
    res.status(500).json({ error: 'Error al obtener la receta' });
  }
});

// Crear receta
router.post('/', verificarToken, async (req, res) => {
  const { titulo, descripcion, imagen_url, tiempo_prep, tiempo_coccion, porciones, dificultad, categoria_id, ingredientes, pasos } = req.body;
  if (!titulo) return res.status(400).json({ error: 'El título es requerido' });

  try {
    const [result] = await pool.query(
      'INSERT INTO recetas (usuario_id, categoria_id, titulo, descripcion, imagen_url, tiempo_prep, tiempo_coccion, porciones, dificultad) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.usuario.id, categoria_id || null, titulo, descripcion || null, imagen_url || null,
       tiempo_prep || null, tiempo_coccion || null, porciones || 4, dificultad || 'Fácil']
    );
    const rid = result.insertId;

    if (ingredientes?.length) {
      for (const ing of ingredientes) {
        if (ing.nombre?.trim())
          await pool.query('INSERT INTO ingredientes (receta_id, nombre, cantidad) VALUES (?,?,?)',
            [rid, ing.nombre.trim(), ing.cantidad || '']);
      }
    }
    if (pasos?.length) {
      for (let i = 0; i < pasos.length; i++) {
        if (pasos[i]?.trim())
          await pool.query('INSERT INTO pasos (receta_id, numero, descripcion) VALUES (?,?,?)',
            [rid, i + 1, pasos[i].trim()]);
      }
    }
    res.status(201).json({ id: rid, mensaje: 'Receta creada exitosamente' });
  } catch {
    res.status(500).json({ error: 'Error al crear la receta' });
  }
});

// Editar receta (solo el autor)
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT usuario_id FROM recetas WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Receta no encontrada' });
    if (rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ error: 'No puedes editar esta receta' });

    const { titulo, descripcion, imagen_url, tiempo_prep, tiempo_coccion, porciones, dificultad, categoria_id } = req.body;
    await pool.query(
      'UPDATE recetas SET titulo=?, descripcion=?, imagen_url=?, tiempo_prep=?, tiempo_coccion=?, porciones=?, dificultad=?, categoria_id=? WHERE id=?',
      [titulo, descripcion, imagen_url, tiempo_prep, tiempo_coccion, porciones, dificultad, categoria_id, req.params.id]
    );
    res.json({ mensaje: 'Receta actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// Eliminar receta (solo el autor)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT usuario_id FROM recetas WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Receta no encontrada' });
    if (rows[0].usuario_id !== req.usuario.id)
      return res.status(403).json({ error: 'No puedes eliminar esta receta' });

    await pool.query('DELETE FROM recetas WHERE id=?', [req.params.id]);
    res.json({ mensaje: 'Receta eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
