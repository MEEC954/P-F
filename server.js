const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'mi_secreto_seguro',
        resave: false,
        saveUninitialized: false,
    })
);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos SQLite3
const db = new sqlite3.Database('./notasApp.db', err => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa a SQLite3.');
        initializeDatabase();
    }
});

// Inicializar tablas en SQLite3
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users (id)
        )
    `);
}

// Rutas de autenticación
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al procesar la contraseña.' });
        }

        db.run(
            `INSERT INTO users (username, password) VALUES (?, ?)`,
            [username, hashedPassword],
            function (err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado.' });
                    }
                    return res.status(500).json({ success: false, message: 'Error al registrar el usuario.' });
                }
                res.json({ success: true, message: 'Usuario registrado con éxito.' });
            }
        );
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al buscar el usuario.' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
            }

            req.session.userId = user.id;
            res.json({ success: true, message: 'Inicio de sesión exitoso.' });
        });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión.' });
        }
        res.json({ success: true, message: 'Sesión cerrada con éxito.' });
    });
});

// Rutas de notas
app.get('/api/notes', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    db.all(`SELECT * FROM notes WHERE userId = ?`, [req.session.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al obtener las notas.' });
        }
        res.json({ success: true, notes: rows });
    });
});

app.post('/api/notes', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, message: 'El contenido de la nota no puede estar vacío.' });
    }

    db.run(
        `INSERT INTO notes (userId, content) VALUES (?, ?)`,
        [req.session.userId, content],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error al guardar la nota.' });
            }
            res.json({ success: true, note: { id: this.lastID, content } });
        }
    );
});

app.delete('/api/notes/:id', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'No autorizado.' });
    }

    const noteId = req.params.id;
    db.run(
        `DELETE FROM notes WHERE id = ? AND userId = ?`,
        [noteId, req.session.userId],
        function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error al eliminar la nota.' });
            }
            res.json({ success: true, message: 'Nota eliminada con éxito.' });
        }
    );
});

// Iniciar servidor automáticamente
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
