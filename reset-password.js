document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-form');
    const messageEl = document.getElementById('message');
    const API_URL = 'https://gridboard-api.onrender.com'; // Your live API URL

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        if (password !== confirmPassword) {
            messageEl.textContent = 'As senhas não coincidem.';
            messageEl.style.color = 'red';
            return;
        }

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            messageEl.textContent = 'Token de reset não encontrado.';
            messageEl.style.color = 'red';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const responseText = await response.text();
            if (response.ok) {
                messageEl.textContent = responseText;
                messageEl.style.color = 'green';
                form.reset();
            } else {
                messageEl.textContent = responseText;
                messageEl.style.color = 'red';
            }
        } catch (error) {
            messageEl.textContent = 'Erro de conexão com o servidor.';
            messageEl.style.color = 'red';
        }
    });
});
