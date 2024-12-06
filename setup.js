const { exec } = require('child_process');
const fs = require('fs');

// Paso 1: Instalar las dependencias
console.log('Instalando dependencias...');
exec('npm install express session sqlite3 bcrypt', (err, stdout, stderr) => {
    if (err) {
        console.error(`Error al instalar las dependencias: ${stderr}`);
        process.exit(1);
    }
    console.log(stdout);

    // Paso 2: Crear la base de datos si no existe
    const dbFile = './notasApp.db';
    if (!fs.existsSync(dbFile)) {
        console.log('Creando la base de datos SQLite...');
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(dbFile, dbErr => {
            if (dbErr) {
                console.error('Error al crear la base de datos:', dbErr);
                process.exit(1);
            }

            // Crear tablas
            db.serialize(() => {
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
                console.log('Base de datos y tablas creadas con éxito.');
                db.close();
            });
        });
    } else {
        console.log('La base de datos ya existe. Saltando este paso...');
    }

    // Paso 3: Iniciar el servidor
    console.log('Iniciando el servidor...');
    const serverProcess = exec('node server.js');
    serverProcess.stdout.on('data', data => console.log(data));
    serverProcess.stderr.on('data', data => console.error(data));
});
