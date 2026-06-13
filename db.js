const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'recetas_db',
  waitForConnections: true,
  connectionLimit: 10
});

async function seedDatabase() {
  const [users] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
  if (users[0].total > 0) return;

  console.log('Insertando datos de prueba...');

  const hash = async (p) => bcrypt.hash(p, 10);

  const [u1] = await pool.query(
    'INSERT INTO usuarios (username, email, password, nombre, bio) VALUES (?,?,?,?,?)',
    ['admin', 'admin@recetario.com', await hash('admin123'), 'Chef Admin', 'Administrador del recetario y cocinero apasionado.']
  );
  const [u2] = await pool.query(
    'INSERT INTO usuarios (username, email, password, nombre, bio) VALUES (?,?,?,?,?)',
    ['maricocinera', 'mari@email.com', await hash('user123'), 'María López', 'Amante de la cocina mexicana tradicional.']
  );
  const [u3] = await pool.query(
    'INSERT INTO usuarios (username, email, password, nombre, bio) VALUES (?,?,?,?,?)',
    ['carlos_chef', 'carlos@email.com', await hash('user123'), 'Carlos Ruiz', 'Especialista en repostería y panadería.']
  );

  const uid1 = u1.insertId, uid2 = u2.insertId, uid3 = u3.insertId;

  const cats = ['Desayunos','Comidas','Cenas','Postres','Bebidas','Ensaladas','Sopas','Snacks'];
  const icons = ['🍳','🍽️','🌙','🍰','🥤','🥗','🍲','🥪'];
  const catIds = [];
  for (let i = 0; i < cats.length; i++) {
    const [r] = await pool.query('INSERT INTO categorias (nombre, icono) VALUES (?,?)', [cats[i], icons[i]]);
    catIds.push(r.insertId);
  }


  const recetasData = [
    [uid1, catIds[1], 'Tacos de Carnitas',
     'Los mejores tacos de carnitas con la receta tradicional michoacana, jugosos y llenos de sabor.',
     'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', 20, 90, 6, 'Media'],
    [uid2, catIds[3], 'Pastel de Chocolate',
     'Pastel esponjoso y húmedo con ganache de chocolate oscuro. Perfecto para celebrar.',
     'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600', 30, 35, 10, 'Media'],
    [uid3, catIds[0], 'Hotcakes Esponjosos',
     'Hotcakes suaves y esponjosos para un desayuno perfecto. Con maple son irresistibles.',
     'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', 10, 20, 4, 'Fácil'],
    [uid1, catIds[6], 'Sopa de Lima Yucateca',
     'Sopa tradicional yucateca con pollo desmenuzado, lima y totopos crujientes.',
     'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', 15, 45, 6, 'Fácil'],
    [uid2, catIds[5], 'Ensalada César',
     'La clásica ensalada César con aderezo cremoso casero, crutones dorados y parmesano.',
     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', 15, 10, 2, 'Fácil'],
    [uid3, catIds[4], 'Agua de Jamaica',
     'Refrescante agua de jamaica natural, perfecta para el calor. Sin colorantes.',
     'https://images.unsplash.com/photo-1560963689-b5682b6440f8?w=600', 10, 15, 8, 'Fácil'],
    [uid1, catIds[1], 'Chiles en Nogada',
     'El platillo más emblemático de México: nogada cremosa, granada y perejil.',
     'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600', 60, 45, 6, 'Difícil'],
    [uid2, catIds[3], 'Churros con Chocolate',
     'Churros crujientes por fuera y suaves por dentro para mojar en chocolate caliente.',
     'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600', 15, 20, 4, 'Fácil'],
  ];

  const recetaIds = [];
  for (const r of recetasData) {
    const [res] = await pool.query(
      'INSERT INTO recetas (usuario_id,categoria_id,titulo,descripcion,imagen_url,tiempo_prep,tiempo_coccion,porciones,dificultad) VALUES (?,?,?,?,?,?,?,?,?)',
      r
    );
    recetaIds.push(res.insertId);
  }


  const ings = [
    [recetaIds[0], 'Carne de cerdo (pierna)', '1.5 kg'],
    [recetaIds[0], 'Naranja', '2 piezas'],
    [recetaIds[0], 'Leche', '1/2 taza'],
    [recetaIds[0], 'Manteca de cerdo', '3 cucharadas'],
    [recetaIds[0], 'Ajo', '4 dientes'],
    [recetaIds[0], 'Sal y pimienta', 'al gusto'],
    [recetaIds[0], 'Tortillas de maíz', '20 piezas'],
    [recetaIds[0], 'Cilantro y cebolla picados', 'al gusto'],
 

    [recetaIds[1], 'Harina', '2 tazas'],
    [recetaIds[1], 'Cacao en polvo', '3/4 taza'],
    [recetaIds[1], 'Azúcar', '2 tazas'],
    [recetaIds[1], 'Polvo para hornear', '2 cucharaditas'],
    [recetaIds[1], 'Huevos', '3 piezas'],
    [recetaIds[1], 'Leche', '1 taza'],
    [recetaIds[1], 'Aceite vegetal', '1/2 taza'],
    [recetaIds[1], 'Crema para batir', '1 taza'],
    [recetaIds[1], 'Chocolate oscuro', '200 g'],


    [recetaIds[2], 'Harina', '2 tazas'],
    [recetaIds[2], 'Polvo para hornear', '2 cucharaditas'],
    [recetaIds[2], 'Azúcar', '3 cucharadas'],
    [recetaIds[2], 'Sal', '1/2 cucharadita'],
    [recetaIds[2], 'Leche', '1 1/2 tazas'],
    [recetaIds[2], 'Huevo', '1 pieza'],
    [recetaIds[2], 'Mantequilla derretida', '3 cucharadas'],
  ];
  for (const ing of ings) {
    await pool.query('INSERT INTO ingredientes (receta_id, nombre, cantidad) VALUES (?,?,?)', ing);
  }


  const pasos = [
    [recetaIds[0], 1, 'Cortar la carne en trozos de 5 cm. Sazonar con sal y pimienta por todos lados.'],
    [recetaIds[0], 2, 'En olla de fondo grueso, calentar la manteca y dorar la carne por todos sus lados.'],
    [recetaIds[0], 3, 'Agregar jugo de naranja, leche, ajos machacados y cubrir con agua. Llevar a ebullición.'],
    [recetaIds[0], 4, 'Bajar el fuego, tapar y cocinar 1.5 horas hasta que la carne se deshaga fácilmente.'],
    [recetaIds[0], 5, 'Subir el fuego y dejar evaporar el líquido hasta que la carne se dore en su propia grasa.'],
    [recetaIds[0], 6, 'Desmenuzar y servir en tortillas calientes con cilantro, cebolla, salsa y limón.'],
    

    [recetaIds[1], 1, 'Precalentar el horno a 175°C. Engrasar y enharinar dos moldes de 23 cm.'],
    [recetaIds[1], 2, 'Mezclar harina, cacao, azúcar, polvo para hornear y sal en un tazón grande.'],
    [recetaIds[1], 3, 'Batir huevos, leche y aceite. Incorporar a los secos poco a poco hasta integrar.'],
    [recetaIds[1], 4, 'Dividir en los moldes y hornear 30-35 min. Enfriar antes de desmoldar.'],
    [recetaIds[1], 5, 'Para el ganache: calentar la crema y verter sobre el chocolate picado. Mezclar hasta homogéneo.'],
    [recetaIds[1], 6, 'Cubrir el pastel con el ganache. Refrigerar 1 hora antes de servir.'],
 

    [recetaIds[2], 1, 'Mezclar ingredientes secos (harina, polvo, azúcar, sal) en un tazón.'],
    [recetaIds[2], 2, 'En otro tazón batir huevo, leche y mantequilla derretida.'],
    [recetaIds[2], 3, 'Combinar húmedos con secos sin batir de más; deben quedar algunos grumos.'],
    [recetaIds[2], 4, 'Calentar sartén a fuego medio, engrasar y verter 1/4 taza de mezcla por hotcake.'],
    [recetaIds[2], 5, 'Cocinar hasta que salgan burbujas, voltear y dorar 1-2 min. Servir con maple.'],
  ];
  for (const p of pasos) {
    await pool.query('INSERT INTO pasos (receta_id, numero, descripcion) VALUES (?,?,?)', p);
  }

  // Comentarios
  await pool.query('INSERT INTO comentarios (usuario_id, receta_id, contenido, calificacion) VALUES (?,?,?,?)',
    [uid2, recetaIds[0], '¡Quedaron deliciosas! Todos en la reunión pidieron la receta.', 5]);
  await pool.query('INSERT INTO comentarios (usuario_id, receta_id, contenido, calificacion) VALUES (?,?,?,?)',
    [uid3, recetaIds[0], 'Muy buena receta, el resultado fue espectacular.', 5]);
  await pool.query('INSERT INTO comentarios (usuario_id, receta_id, contenido, calificacion) VALUES (?,?,?,?)',
    [uid1, recetaIds[1], 'El pastel quedó perfecto, muy húmedo. El ganache es lo mejor.', 5]);
  await pool.query('INSERT INTO comentarios (usuario_id, receta_id, contenido, calificacion) VALUES (?,?,?,?)',
    [uid3, recetaIds[2], 'Los hotcakes más esponjosos que he hecho. Truco de no batir de más = clave.', 4]);


    
  for (const [u, r] of [[uid2, recetaIds[0]], [uid2, recetaIds[3]], [uid3, recetaIds[1]], [uid3, recetaIds[2]], [uid1, recetaIds[1]]]) {
    await pool.query('INSERT INTO favoritos (usuario_id, receta_id) VALUES (?,?) ON DUPLICATE KEY UPDATE creado_en=creado_en', [u, r]);
  }

  console.log('✅ Datos de prueba insertados correctamente.');
}

module.exports = { pool, seedDatabase };
