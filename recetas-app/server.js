const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedDatabase } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/recetas',     require('./routes/recetas'));
app.use('/api/categorias',  require('./routes/categorias'));
app.use('/api/favoritos',   require('./routes/favoritos'));
app.use('/api/comentarios', require('./routes/comentarios'));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api'))
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`\n🍳 Recetario corriendo en http://localhost:${PORT}`);
  try {
    await seedDatabase();
  } catch (e) {
    console.error('⚠️  No se pudo conectar a MySQL:', e.message);
    console.error('   Verifica que XAMPP esté corriendo y hayas ejecutado setup.sql\n');
  }
});
