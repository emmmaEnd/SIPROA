// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// === Configuración básica ===
const PORT = process.env.PORT || 3000;

// Permitir peticiones desde el frontend (Vite corre por defecto en 5173)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// === Ruta de prueba ===
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hola desde Express API' });
});

// === Arrancar servidor ===
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
