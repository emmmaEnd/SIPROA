require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// ─────────────────────────────────────────────
// Configuración básica
// ─────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173', // Vite
  credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ─────────────────────────────────────────────
// "Base de datos" temporal en memoria
// (luego la sustituimos por tu BD real)
// ─────────────────────────────────────────────
let users = [];
let nextId = 1;

// crea usuario con rol maestro por defecto
function createUser(nombre_usuario, clave_plana, rolesExtra = []) {
  const existe = users.find(u => u.nombre_usuario === nombre_usuario);
  if (existe) {
    throw new Error('El nombre de usuario ya existe');
  }

  const hash = bcrypt.hashSync(clave_plana, 10);

  const user = {
    id_usuario: nextId++,
    nombre_usuario,
    clave: hash,
    roles: ['maestro', ...rolesExtra], // maestro básico
  };

  users.push(user);
  return user;
}

// usuario admin de prueba
const admin = createUser('admin', 'admin123', ['admin']);

// ─────────────────────────────────────────────
// Helpers de JWT y middlewares
// ─────────────────────────────────────────────
function generarToken(user) {
  return jwt.sign(
    {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: '2h' },
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(role)) {
      return res.status(403).json({ message: 'No tienes permisos suficientes' });
    }
    next();
  };
}

// ─────────────────────────────────────────────
// Rutas de autenticación
// ─────────────────────────────────────────────

// Registro básico: crea usuario con rol maestro
app.post('/api/register', (req, res) => {
  const { nombre_usuario, clave } = req.body;

  if (!nombre_usuario || !clave) {
    return res.status(400).json({
      message: 'nombre_usuario y clave son obligatorios',
    });
  }

  try {
    const nuevo = createUser(nombre_usuario, clave);
    const token = generarToken(nuevo);

    res.status(201).json({
      user: {
        id_usuario: nuevo.id_usuario,
        nombre_usuario: nuevo.nombre_usuario,
        roles: nuevo.roles,
      },
      token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { nombre_usuario, clave } = req.body;

  if (!nombre_usuario || !clave) {
    return res.status(400).json({
      message: 'nombre_usuario y clave son obligatorios',
    });
  }

  const user = users.find(u => u.nombre_usuario === nombre_usuario);
  if (!user) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }

  const ok = bcrypt.compareSync(clave, user.clave);
  if (!ok) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }

  const token = generarToken(user);
  res.json({
    user: {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      roles: user.roles,
    },
    token,
  });
});

// Página "home" protegida (cualquier usuario logueado)
app.get('/api/home', authMiddleware, (req, res) => {
  res.json({
    message: `Bienvenido a SIPROA, ${req.user.nombre_usuario}`,
    roles: req.user.roles,
  });
});

// Ruta de ejemplo solo para admin (por los roles)
app.get('/api/admin-only', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ message: 'Solo admins pueden ver esto.' });
});

// ─────────────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Backend SIPROA escuchando en http://localhost:${PORT}`);
});
