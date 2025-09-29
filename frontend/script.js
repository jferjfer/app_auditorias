document.addEventListener('DOMContentLoaded', function() {
    // ... (Keep all existing code from start to setupGlobalListeners)

    // --- Listeners Globales ---
    function setupGlobalListeners() {
        // **REMOVED** authForm.addEventListener('submit', ...);

        // **NEW** Robust click listeners for login and register
        document.getElementById('login-btn')?.addEventListener('click', async (event) => {
            event.preventDefault();
            const email = document.getElementById('correo_electronico').value;
            const password = document.getElementById('contrasena').value;
            if (!email || !password) return alert('Por favor, ingresa correo y contraseña.');

            const url = `${API_URL}/auth/login`;
            const body = new URLSearchParams({ username: email, password });
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

            try {
                const response = await fetch(url, { method: 'POST', headers, body });
                const result = await response.json();
                if (response.ok) {
                    if (result.access_token) localStorage.setItem('access_token', result.access_token);
                    authModal.hide();
                    checkAuth();
                } else {
                    alert(`Error: ${result.detail}`);
                }
            } catch (error) {
                alert('Error de conexión.');
            }
        });

        document.getElementById('register-btn')?.addEventListener('click', async (event) => {
            event.preventDefault();
            const email = document.getElementById('correo_electronico').value;
            const password = document.getElementById('contrasena').value;
            const name = document.getElementById('nombre').value;
            const role = document.getElementById('rol').value;
            if (!email || !password || !name || !role) return alert('Por favor, completa todos los campos para registrarte.');

            const url = `${API_URL}/auth/register`;
            const body = JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role });
            const headers = { 'Content-Type': 'application/json' };

            try {
                const response = await fetch(url, { method: 'POST', headers, body });
                const result = await response.json();
                if (response.ok) {
                    alert('Registro exitoso. Ahora puedes iniciar sesión.');
                    // Optionally log in the user directly
                    if (result.access_token) {
                        localStorage.setItem('access_token', result.access_token);
                        authModal.hide();
                        checkAuth();
                    }
                } else {
                    alert(`Error: ${result.detail}`);
                }
            } catch (error) {
                alert('Error de conexión.');
            }
        });

        document.querySelector('[data-target="logout"]').addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
        });

        document.getElementById('download-report-btn')?.addEventListener('click', () => {
            const params = new URLSearchParams({
                status: document.getElementById('filterStatus').value,
                auditor_id: document.getElementById('filterAuditor').value,
                date: document.getElementById('filterDate').value
            });
            window.location.href = `${API_URL}/audits/report?${params.toString()}`;
        });

        document.getElementById('confirm-add-user')?.addEventListener('click', async () => {
            const name = document.getElementById('new-user-name').value;
            const email = document.getElementById('new-user-email').value;
            const password = document.getElementById('new-user-password').value;
            const role = document.getElementById('new-user-role').value;
            if (!name || !email || !password || !role) return alert('Por favor, completa todos los campos.');
            try {
                const response = await fetch(`${API_URL}/users/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify({ nombre: name, correo: email, contrasena: password, rol: role }) });
                if (response.ok) {
                    alert('Usuario creado exitosamente.');
                    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                    loadDashboardData('administrador', getToken());
                } else {
                    alert(`Error: ${(await response.json()).detail}`);
                }
            } catch (error) {
                alert('Error de red.');
            }
        });
    }

    // ... (The rest of the file is the same)
});