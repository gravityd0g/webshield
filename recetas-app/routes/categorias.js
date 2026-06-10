const router = require('express').Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cat.*, COUNT(r.id) as total_recetas
      FROM categorias cat
      LEFT JOIN recetas r ON r.categoria_id = cat.id
      GROUP BY cat.id ORDER BY cat.nombre
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

module.exports = router;
