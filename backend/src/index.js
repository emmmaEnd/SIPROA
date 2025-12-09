require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const supabase = require('./supabase');

const upload = multer(); // archivos en memoria
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
// Helpers de autenticación
// ─────────────────────────────────────────────
function generarToken(user) {
  return jwt.sign(
    {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      roles: user.roles,
    },
    JWT_SECRET,
    { expiresIn: '2h' }
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

function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles || !req.user.roles.includes(roleName)) {
      return res.status(403).json({ message: 'No tienes permisos suficientes' });
    }
    next();
  };
}

// ─────────────────────────────────────────────
// Crear usuario (MAESTRO + roles extra) con supabase-js
// ─────────────────────────────────────────────
async function createUser(nombre_usuario, clave_plana, rolesExtra = []) {
  // 1) Verificar que no exista
  const { data: existente, error: existeError } = await supabase
    .from('usuario')
    .select('id_usuario')
    .eq('nombre_usuario', nombre_usuario)
    .maybeSingle();

  if (existeError) {
    throw new Error('Error verificando usuario: ' + existeError.message);
  }
  if (existente) {
    throw new Error('El nombre de usuario ya existe');
  }

  // 2) Insertar usuario con contraseña hasheada
  const hash = bcrypt.hashSync(clave_plana, 10);

  const { data: nuevo, error: insertError } = await supabase
    .from('usuario')
    .insert({ nombre_usuario, clave: hash })
    .select('id_usuario, nombre_usuario')
    .single();

  if (insertError) {
    throw new Error('Error insertando usuario: ' + insertError.message);
  }

  // 3) Asignar roles: MAESTRO + extras
  const roles = ['MAESTRO', ...rolesExtra];

  for (const nombreRol of roles) {
    const { data: rol, error: rolError } = await supabase
      .from('rol')
      .select('id_rol')
      .eq('nombre', nombreRol)
      .maybeSingle();

    if (rolError) {
      throw new Error('Error buscando rol: ' + rolError.message);
    }
    if (!rol) {
      throw new Error(`El rol "${nombreRol}" no existe en la tabla rol`);
    }

    const { error: relError } = await supabase
      .from('usuario_rol')
      .insert({
        id_usuario: nuevo.id_usuario,
        id_rol: rol.id_rol,
      });

    if (relError) {
      throw new Error('Error asignando rol: ' + relError.message);
    }
  }

  return {
    id_usuario: nuevo.id_usuario,
    nombre_usuario: nuevo.nombre_usuario,
    roles,
  };
}

// ─────────────────────────────────────────────
// Crear usuario admin por defecto si no existe
// ─────────────────────────────────────────────
(async () => {
  try {
    const { data: admin, error } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('nombre_usuario', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error verificando admin:', error.message);
      return;
    }

    if (!admin) {
      await createUser('admin', 'admin123', ['ADMINISTRADOR']);
      console.log('Usuario admin creado por defecto');
    } else {
      console.log('Usuario admin ya existe');
    }
  } catch (err) {
    console.error('Error asegurando usuario admin:', err.message);
  }
})();

// ─────────────────────────────────────────────
// Rutas de autenticación
// ─────────────────────────────────────────────

// Registro (usuario + contraseña) → rol MAESTRO
app.post('/api/register', async (req, res) => {
  const { nombre_usuario, clave } = req.body;

  if (!nombre_usuario || !clave) {
    return res.status(400).json({
      message: 'nombre_usuario y clave son obligatorios',
    });
  }

  try {
    const nuevo = await createUser(nombre_usuario, clave);
    const token = generarToken(nuevo);

    res.status(201).json({
      user: nuevo,
      token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Error al registrar' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { nombre_usuario, clave } = req.body;

  if (!nombre_usuario || !clave) {
    return res.status(400).json({
      message: 'nombre_usuario y clave son obligatorios',
    });
  }

  try {
    // 1) Buscar usuario
    const { data: usuarios, error: userError } = await supabase
      .from('usuario')
      .select('id_usuario, nombre_usuario, clave')
      .eq('nombre_usuario', nombre_usuario)
      .limit(1);

    if (userError) {
      console.error(userError);
      return res.status(500).json({ message: 'Error buscando usuario' });
    }

    if (!usuarios || usuarios.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const userRow = usuarios[0];

    // 2) Verificar contraseña
    const ok = bcrypt.compareSync(clave, userRow.clave);
    if (!ok) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // 3) Obtener roles desde usuario_rol + rol
    const { data: userRoles, error: relError } = await supabase
      .from('usuario_rol')
      .select('id_rol')
      .eq('id_usuario', userRow.id_usuario);

    if (relError) {
      console.error(relError);
      return res.status(500).json({ message: 'Error cargando roles' });
    }

    let roles = [];

    if (userRoles && userRoles.length > 0) {
      const roleIds = userRoles.map(r => r.id_rol);

      const { data: rolesRows, error: rolesError } = await supabase
        .from('rol')
        .select('id_rol, nombre')
        .in('id_rol', roleIds);

      if (rolesError) {
        console.error(rolesError);
        return res.status(500).json({ message: 'Error cargando nombres de roles' });
      }

      roles = rolesRows.map(r => r.nombre);
    }

    const user = {
      id_usuario: userRow.id_usuario,
      nombre_usuario: userRow.nombre_usuario,
      roles,
    };

    const token = generarToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno al iniciar sesión' });
  }
});

// Usuario actual
app.get('/api/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// Home maestro (solo rol MAESTRO)
app.get('/api/maestro/home', authMiddleware, requireRole('MAESTRO'), (req, res) => {
  res.json({
    message: `Bienvenido a SIPROA, ${req.user.nombre_usuario}`,
    roles: req.user.roles,
  });
});

// ─────────────────────────────────────────────
// Subida de archivos a Supabase Storage
// ─────────────────────────────────────────────
// Asegúrate en Supabase de crear un bucket llamado "siproa-evidencias"
const BUCKET = 'siproa-evidencias';

app.post(
  '/api/files/upload',
  authMiddleware,
  requireRole('MAESTRO'),
  upload.single('archivo'),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'Archivo requerido' });
    }

    try {
      const safeName = file.originalname.replace(/\s+/g, '_');
      const filePath = `usuario_${req.user.id_usuario}/${Date.now()}_${safeName}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al subir archivo' });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      return res.json({
        path: filePath,
        url: data.publicUrl,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error interno al subir archivo' });
    }
  }
);

// ─────────────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Backend SIPROA escuchando en http://localhost:${PORT}`);
});
