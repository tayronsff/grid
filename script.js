// GridBoard App Logic

// --- Constants and State ---
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dew1zfaiw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'profile_pics';
const API_URL = 'https://gridboard.onrender.com';
let currentUser = null;
const screens = [
    'home-screen', 'events-screen', 'championship-detail-screen',
    'other-event-detail-screen', 'favorites-screen', 'profile-screen', 'create-championship-screen'
];

// --- UI Management ---
function showScreen(id) {
    if (id === 'profile-screen') {
        populateProfileForm();
    }
    screens.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.toggle('active', s === id);
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach(a => {
        const target = a.getAttribute('onclick') || '';
        a.classList.toggle('active', target.includes(id));
    });
}

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    const isOpen = menu.classList.toggle('open');
    overlay.classList.toggle('visible', isOpen);
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function updateUIAfterLogin(user) {
    document.querySelector('.cta-login').style.display = 'none';
    const headerUser = document.getElementById('header-logged');
    headerUser.style.display = 'flex';
    headerUser.querySelector('.user-avatar').src = user.picture || `https://i.pravatar.cc/40?u=${user._id}`;
    headerUser.querySelector('.user-name').textContent = user.name.split(' ')[0];

    const sideMenu = document.getElementById('side-menu');
    sideMenu.querySelector('.user-avatar').src = user.picture || `https://i.pravatar.cc/50?u=${user._id}`;
    sideMenu.querySelector('.user-name').textContent = user.name;
    sideMenu.querySelector('.user-email').textContent = user.email;
}

// --- Cloudinary Upload ---
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Cloudinary upload failed.');
        }
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary Error:', error);
        return null;
    }
}

// --- Data Loading ---
async function loadChampionships() {
    try {
        const response = await fetch(`${API_URL}/championships`);
        if (!response.ok) return;
        const championships = await response.json();
        const grid = document.getElementById('championships-grid');
        grid.innerHTML = '';

        if (championships.length === 0) {
            grid.innerHTML = '<p>Nenhum campeonato cadastrado ainda.</p>';
            return;
        }

        championships.forEach(champ => {
            const date = new Date(champ.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-image"><img src="${champ.image}" alt="${champ.name}"></div>
                <div class="event-info">
                    <h3>${champ.name}</h3>
                    <div class="event-meta">
                        <span><i class="fas fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${champ.place}</span>
                    </div>
                    <div class="event-status open">Inscrições Abertas</div>
                </div>`;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading championships:', error);
    }
}

// --- Authentication ---
function logout() {
    currentUser = null;
    localStorage.removeItem('gridboard_user');
    document.querySelector('.cta-login').style.display = 'inline-flex';
    document.getElementById('header-logged').style.display = 'none';
    showScreen('home-screen');
}

async function handleForgotPassword() {
    const email = prompt('Por favor, digite seu e-mail para recuperação da senha:');
    if (!email) return;
    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        alert(await response.text());
    } catch (error) {
        alert('Erro de conexão com o servidor.');
    }
}

// --- Form Handlers ---
function setupFormListeners() {
    // Login/Register Modal Tabs
    const loginModal = document.getElementById('login-modal');
    loginModal.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            loginModal.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loginModal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            loginModal.querySelector(`#${tabId}`).classList.add('active');
        });
    });

    // Registration Form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = { name: form.name.value, email: form.email.value, password: form.password.value };
        if (data.password !== form.confirmPassword.value) {
            return alert('As senhas não coincidem.');
        }
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(await response.text());
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('gridboard_user', JSON.stringify(user));
            updateUIAfterLogin(user);
            showScreen('home-screen');
        } catch (error) {
            alert('Erro ao registrar: ' + error.message);
        }
    });

    // Login Form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = { email: form.querySelector('input[type="email"]').value, password: form.querySelector('input[type="password"]').value };
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('E-mail ou senha inválidos.');
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('gridboard_user', JSON.stringify(user));
            updateUIAfterLogin(user);
            closeLoginModal();
        } catch (error) {
            alert(error.message);
        }
    });

    // Image Preview Listeners
    document.getElementById('profile-file-input').addEventListener('change', (e) => {
        const preview = document.getElementById('profile-preview');
        const file = e.target.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        }
    });

    document.getElementById('champ-file-input').addEventListener('change', (e) => {
        const preview = document.getElementById('champ-preview');
        const file = e.target.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        }
    });

    // Create Championship Form
    document.getElementById('create-championship-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const fileInput = document.getElementById('champ-file-input');
        let imageUrl = '';

        if (fileInput.files[0]) {
            imageUrl = await uploadToCloudinary(fileInput.files[0]);
            if (!imageUrl) {
                return alert('Erro ao fazer upload da imagem de capa.');
            }
        }

        const data = { name: form.name.value, date: form.date.value, place: form.place.value, image: imageUrl };
        try {
            const response = await fetch(`${API_URL}/championships`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao cadastrar campeonato.');
            alert('Campeonato cadastrado com sucesso!');
            form.reset();
            showScreen('home-screen');
            loadChampionships(); // Refresh list
        } catch (error) {
            alert(error.message);
        }
    });

    // Profile Form
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const fileInput = document.getElementById('profile-file-input');
        let imageUrl = currentUser.picture; // Keep old image if none is selected

        if (fileInput.files[0]) {
            imageUrl = await uploadToCloudinary(fileInput.files[0]);
            if (!imageUrl) {
                return alert('Erro ao fazer upload da imagem de perfil.');
            }
        }

        const data = {
            name: document.getElementById('profile-form-name').value,
            email: document.getElementById('profile-form-email').value,
            picture: imageUrl
        };
        try {
            const response = await fetch(`${API_URL}/users/${currentUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(await response.text());
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('gridboard_user', JSON.stringify(updatedUser));
            updateUIAfterLogin(updatedUser);
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar perfil: ' + error.message);
        }
    });
}

function populateProfileForm() {
    if (!currentUser) return;
    document.getElementById('profile-avatar-img').src = currentUser.picture || `https://i.pravatar.cc/120?u=${currentUser._id}`;
    document.getElementById('profile-picture-url').value = currentUser.picture || '';
    document.getElementById('profile-form-name').value = currentUser.name;
    document.getElementById('profile-form-email').value = currentUser.email;
}

function initGooglePlaces() {
    const input = document.getElementById('champ-place');
    if (input) {
        const autocomplete = new google.maps.places.Autocomplete(input, {
            types: ['establishment'], // Suggest specific places/businesses
            componentRestrictions: { country: 'br' } // Restrict to Brazil
        });
        autocomplete.setFields(['formatted_address']);
    }
}

async function loadGoogleMaps() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        const config = await response.json();
        const apiKey = config.googleMapsApiKey;

        if (apiKey) {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.onload = () => {
                // Now that the script is loaded, we can initialize places
                initGooglePlaces();
            };
            document.head.appendChild(script);
        } else {
            console.error('Google Maps API key not found.');
        }
    } catch (error) {
        console.error('Failed to load Google Maps config:', error);
    }
}

// --- App Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('gridboard_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIAfterLogin(currentUser);
    }
    loadChampionships();
    setupFormListeners();
    loadGoogleMaps(); // This will call initGooglePlaces upon success
});
