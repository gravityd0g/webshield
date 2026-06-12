-- ============================================================
--  RECETARIO  |  Pegar y ejecutar en phpMyAdmin
--  Solo crea la base de datos y las tablas.
--  Los datos de prueba se insertan solos al iniciar el servidor.
-- ============================================================

CREATE DATABASE IF NOT EXISTS recetas_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recetas_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  email      VARCHAR(120) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  nombre     VARCHAR(100),
  bio        TEXT,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) UNIQUE NOT NULL,
  icono  VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS recetas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  categoria_id    INT,
  titulo          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  imagen_url      VARCHAR(255),
  tiempo_prep     INT COMMENT 'minutos',
  tiempo_coccion  INT COMMENT 'minutos',
  porciones       INT DEFAULT 4,
  dificultad      ENUM('Fácil','Media','Difícil') DEFAULT 'Fácil',
  creado_en       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ingredientes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  receta_id INT NOT NULL,
  nombre    VARCHAR(100) NOT NULL,
  cantidad  VARCHAR(50),
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pasos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  receta_id   INT NOT NULL,
  numero      INT NOT NULL,
  descripcion TEXT NOT NULL,
  FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INT NOT NULL,
  receta_id  INT NOT NULL,
  creado_en  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, receta_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receta_id)  REFERENCES recetas(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentarios (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  receta_id    INT NOT NULL,
  contenido    TEXT NOT NULL,
  calificacion TINYINT CHECK (calificacion BETWEEN 1 AND 5),
  creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receta_id)  REFERENCES recetas(id)  ON DELETE CASCADE
);
