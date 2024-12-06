let editIndex = null;  // Índice de la nota que se está editando

// Recupera el usuario actualmente autenticado
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

// Guarda el usuario autenticado actual en localStorage
function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}

// Borra el usuario autenticado actual al cerrar sesión
function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Función para redirigir al login si el usuario no está autenticado y está en la página de notas
function checkSession() {
    if (window.location.pathname.includes('notes.html') && !getCurrentUser()) {
        alert('Debes iniciar sesión primero.');
        window.location.href = 'login.html';
    }
}

// Cargar la página de notas y mostrar las notas guardadas
document.addEventListener('DOMContentLoaded', function() {
    checkSession();

    if (window.location.pathname.includes('notes.html')) {
        displayNotes();

        // Manejo del formulario para crear nuevas notas
        document.getElementById('noteForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const note = document.getElementById('note').value;
            if (note) {
                saveNoteForUser(note);
                document.getElementById('note').value = '';
                displayNotes();
            }
        });

        // Manejo del formulario para editar una nota
        document.getElementById('editForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const editedNote = document.getElementById('editNote').value;
            if (editedNote !== '' && editIndex !== null) {
                updateNoteForUser(editIndex, editedNote);
                document.getElementById('editNote').value = '';
                document.getElementById('editForm').style.display = 'none';
                document.getElementById('noteForm').style.display = 'block';
                editIndex = null;
                displayNotes();
            }
        });

        // Manejo del botón para cancelar la edición
        document.getElementById('cancelEdit').addEventListener('click', function() {
            document.getElementById('editForm').style.display = 'none';
            document.getElementById('noteForm').style.display = 'block';
            editIndex = null;
        });

        // Cerrar sesión
        document.getElementById('logout')?.addEventListener('click', function() {
            clearCurrentUser();
            alert('Sesión cerrada.');
            window.location.href = 'login.html';
        });
    }
});

// Registro de usuario
document.getElementById('registerForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (registerUser(username, password)) {
        alert('Registro exitoso. Puedes iniciar sesión ahora.');
        window.location.href = 'login.html';
    }
});

// Inicio de sesión
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (loginUser(username, password)) {
        setCurrentUser(username);
        alert('Inicio de sesión exitoso.');
        window.location.href = 'notes.html';
    } else {
        alert('Nombre de usuario o contraseña incorrectos.');
    }
});

// Función para registrar usuarios
function registerUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(user => user.username === username)) {
        alert('El nombre de usuario ya está registrado.');
        return false;
    }

    users.push({ username, password });
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// Función para iniciar sesión
function loginUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);
    return user ? true : false;
}

// Función para guardar notas
function saveNoteForUser(note) {
    let currentUser = getCurrentUser();
    let notes = JSON.parse(localStorage.getItem(currentUser + '_notes')) || [];
    notes.push(note);
    localStorage.setItem(currentUser + '_notes', JSON.stringify(notes));
}

// Función para actualizar una nota
function updateNoteForUser(index, newNote) {
    let currentUser = getCurrentUser();
    let notes = JSON.parse(localStorage.getItem(currentUser + '_notes')) || [];
    notes[index] = newNote;
    localStorage.setItem(currentUser + '_notes', JSON.stringify(notes));
}

// Función para mostrar las notas
function displayNotes() {
    let currentUser = getCurrentUser();
    let notes = JSON.parse(localStorage.getItem(currentUser + '_notes')) || [];
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    notes.forEach((note, index) => {
        const li = document.createElement('li');
        li.textContent = note;

        // Crear el botón de Editar
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', function() {
            editIndex = index;
            document.getElementById('editNote').value = note;
            document.getElementById('editForm').style.display = 'block';
            document.getElementById('noteForm').style.display = 'none';
        });

        // Crear el botón de Eliminar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.addEventListener('click', function() {
            notes.splice(index, 1);
            localStorage.setItem(currentUser + '_notes', JSON.stringify(notes));
            displayNotes();
        });

        // Añadir los botones al elemento de la lista
        li.appendChild(editButton);
        li.appendChild(deleteButton);
        notesList.appendChild(li);
    });
}

// Validación al registrar un usuario
document.getElementById('registerForm')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    // Enviar los datos al backend
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registro exitoso. Inicia sesión.');
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error(err));
});
