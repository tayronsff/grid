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
    // Mobile header
    document.querySelector('.cta-login').style.display = 'none';
    const headerUser = document.getElementById('header-logged');
    headerUser.style.display = 'flex';
    headerUser.querySelector('.user-avatar').src = user.picture || `https://i.pravatar.cc/40?u=${user._id}`;
    headerUser.querySelector('.user-name').textContent = user.name.split(' ')[0];

    // Desktop header
    document.getElementById('desktop-login-btn').style.display = 'none';
    const desktopProfile = document.getElementById('desktop-user-profile');
    desktopProfile.style.display = 'inline-block';
    document.getElementById('desktop-avatar').src = user.picture || `https://i.pravatar.cc/40?u=${user._id}`;

    // Side menu
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
    
    // Mobile header
    document.querySelector('.cta-login').style.display = 'inline-flex';
    document.getElementById('header-logged').style.display = 'none';

    // Desktop header
    document.getElementById('desktop-login-btn').style.display = 'inline-flex';
    document.getElementById('desktop-user-profile').style.display = 'none';

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

    document.getElementById('champ-state').addEventListener('change', (e) => {
        populateCities(e.target.value);
    });

    document.getElementById('champ-num-stages').addEventListener('input', (e) => {
        const count = parseInt(e.target.value, 10) || 0;
        generateStageFields(count);
    });

    // Create/Update Championship Form
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

        const stages = [];
        const numStages = parseInt(document.getElementById('champ-num-stages').value, 10) || 0;
        for (let i = 0; i < numStages; i++) {
            const stageIndex = i + 1;
            // We would also handle stage image uploads here in a real scenario
            stages.push({
                name: document.getElementById(`stage-name-${stageIndex}`).value,
                date: document.getElementById(`stage-date-${stageIndex}`).value,
                location: document.getElementById(`stage-location-${stageIndex}`).value,
            });
        }

        const data = {
            name: document.getElementById('champ-name').value,
            organizer: document.getElementById('champ-organizer').value,
            date: document.getElementById('champ-date').value,
            contactPhone: document.getElementById('champ-contact-phone').value,
            contactEmail: document.getElementById('champ-contact-email').value,
            state: document.getElementById('champ-state').value,
            city: document.getElementById('champ-city').value,
            place: document.getElementById('champ-place').value,
            image: imageUrl,
            stages: stages,
            creator: currentUser._id // Add creator ID
        };

        try {
            const champId = document.getElementById('champ-id').value;
            const isEditing = !!champId;
            const url = isEditing ? `${API_URL}/championships/${champId}` : `${API_URL}/championships`;
            const method = isEditing ? 'PUT' : 'POST';

            if(isEditing) data.userId = currentUser._id; // Add userId for authorization on update

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao cadastrar campeonato.');
            alert(`Campeonato ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
            form.reset();
            document.getElementById('dynamic-stages-container').innerHTML = ''; // Clear stages
            showScreen('profile-screen'); // Go to profile to see the list
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

async function populateProfileForm() {
    if (!currentUser) return;
    document.getElementById('profile-avatar-img').src = currentUser.picture || `https://i.pravatar.cc/120?u=${currentUser._id}`;
    document.getElementById('profile-form-name').value = currentUser.name;
    document.getElementById('profile-form-email').value = currentUser.email;

    // Load and display user's created championships
    try {
        const response = await fetch(`${API_URL}/users/${currentUser._id}/championships`);
        const championships = await response.json();
        const container = document.getElementById('created-championships-list');
        container.innerHTML = ''; // Clear previous list
        if (championships.length > 0) {
            championships.forEach(champ => {
                const champElement = document.createElement('div');
                champElement.className = 'user-championship-item';
                champElement.innerHTML = `
                    <span>${champ.name}</span>
                    <button class="btn-secondary btn-sm" onclick="editChampionship('${champ._id}')">Editar</button>
                `;
                container.appendChild(champElement);
            });
        } else {
            container.innerHTML = '<p>Você ainda não criou nenhum campeonato.</p>';
        }
    } catch (error) {
        console.error('Failed to load created championships:', error);
    }
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

// --- Championship Form Logic ---
async function populateStates() {
    const stateSelect = document.getElementById('champ-state');
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const states = await response.json();
        stateSelect.innerHTML = '<option value="">Selecione o Estado</option>';
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.sigla;
            option.textContent = state.nome;
            stateSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load states:', error);
    }
}

async function populateCities(state) {
    const citySelect = document.getElementById('champ-city');
    citySelect.disabled = true;
    citySelect.innerHTML = '<option value="">Carregando...</option>';
    if (!state) {
        citySelect.innerHTML = '<option value="">Selecione um estado primeiro</option>';
        return;
    }
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`);
        const cities = await response.json();
        citySelect.innerHTML = '<option value="">Selecione a Cidade</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.nome;
            option.textContent = city.nome;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
    } catch (error) {
        console.error('Failed to load cities:', error);
    }
}

function generateStageFields(count) {
    const container = document.getElementById('dynamic-stages-container');
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const stageIndex = i + 1;
        const stageEl = document.createElement('div');
        stageEl.className = 'stage-form-group';
        stageEl.innerHTML = `
            <h4>Etapa ${stageIndex}</h4>
            <div class="input-group">
                <label for="stage-name-${stageIndex}">Nome da Etapa</label>
                <input type="text" id="stage-name-${stageIndex}" required>
            </div>
            <div class="input-row">
                <div class="input-group">
                    <label for="stage-date-${stageIndex}">Data</label>
                    <input type="date" id="stage-date-${stageIndex}" required>
                </div>
                <div class="input-group">
                    <label for="stage-location-${stageIndex}">Local</label>
                    <input type="text" id="stage-location-${stageIndex}" required>
                </div>
            </div>
            <div class="input-group">
                <label for="stage-file-input-${stageIndex}">Imagem da Etapa (Opcional)</label>
                <input type="file" id="stage-file-input-${stageIndex}" accept="image/*" style="display: none;">
                <button type="button" class="btn-secondary btn-sm" onclick="document.getElementById('stage-file-input-${stageIndex}').click();">Escolher Arquivo</button>
            </div>
        `;
        container.appendChild(stageEl);
    }
}

async function editChampionship(champId) {
    // This function would fetch the championship details and populate the form
    // For now, we'll just show the screen
    showScreen('create-championship-screen');
    // In a real scenario, you'd fetch champ data and call a populate function
    alert('Funcionalidade de edição em breve! Preencha o formulário para criar um novo.');
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
    populateStates();
});
