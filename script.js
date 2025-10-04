// GridBoard minimal interactivity
const screens = [
  'login-screen','home-screen','events-screen','championship-detail-screen',
  'other-event-detail-screen','favorites-screen','profile-screen','create-championship-screen'
];

function showScreen(id){
  screens.forEach(s=>{
    const el = document.getElementById(s);
    if(!el) return;
    el.classList.toggle('active', s===id);
  });
  // bottom nav state
  document.querySelectorAll('.bottom-nav .nav-item').forEach(a=>{
    const target = a.getAttribute('onclick')||'';
    a.classList.toggle('active', target.includes(id));
  });
  if(id==='events-screen'){
    // Ensure filters reflect current state when entering events screen
    syncFilterChips();
    applyFilters();
  }

function navigateToEventsWithFilter(type){
  if(type){ filterState.type = type; }
  showScreen('events-screen');
  // Sync chips and apply filters after navigation
  syncFilterChips();
  applyFilters();
}
}

function toggleMenu(){
  const menu = document.getElementById('side-menu');
  const overlay = document.getElementById('menu-overlay');
  const isOpen = menu.classList.toggle('open');
  overlay.classList.toggle('visible', isOpen);
}

// Login modal controls
function openLoginModal(){
  const modal = document.getElementById('login-modal');
  if(modal){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); }
}
function closeLoginModal(){
  const modal = document.getElementById('login-modal');
  if(modal){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
}

function loginWithFacebook(){ simulateLogin('João'); }
function loginWithGoogle(){ simulateLogin('João'); }

function simulateLogin(firstName){
  // switch header state
  document.getElementById('header-not-logged').style.display = 'none';
  const headerLogged = document.getElementById('header-logged');
  headerLogged.style.display = 'flex';
  headerLogged.querySelector('.user-name').textContent = firstName;
  showScreen('home-screen');
}

function showSignup(){ alert('Cadastro em breve.'); }
function showLocationSearch(){ alert('Busca por local (Google Maps) em breve.'); }
function showFilters(){ showScreen('events-screen'); }
function toggleMapView(){ alert('Visualização no mapa em breve.'); }
function showLocationFilter(){ alert('Filtro de localização em breve.'); }
function registerForEvent(){ alert('Inscrição enviada!'); }
function toggleFavorite(btn){ if(btn){ btn.classList.toggle('active'); } }

function showFavoritesTab(which){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  if(which==='registered'){
    document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('registered-tab').classList.add('active');
  } else {
    document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('favorites-tab').classList.add('active');
  }
}

function changeAvatar(){ alert('Alterar avatar em breve.'); }
function logout(){
  document.getElementById('header-logged').style.display = 'none';
  document.getElementById('header-not-logged').style.display = 'block';
  showScreen('login-screen');
}

function addStage(){
  const container = document.getElementById('stages-container');
  const block = document.createElement('div');
  block.className = 'stage-form';
  block.innerHTML = `
    <div class="input-group">
      <label>Nome da Etapa</label>
      <input type="text" placeholder="Ex: 2ª Etapa - Classificatória" required>
    </div>
    <div class="input-row">
      <div class="input-group">
        <label>Data</label>
        <input type="date" required>
      </div>
      <div class="input-group">
        <label>Horário</label>
        <input type="time" required>
      </div>
    </div>
    <div class="input-group">
      <label>Local</label>
      <input type="text" placeholder="Nome do kartódromo ou endereço" required>
    </div>`;
  container.appendChild(block);
}

// Email form fake submit
window.addEventListener('DOMContentLoaded', ()=>{
  const emailForm = document.querySelector('#login-screen .email-form');
  if(emailForm){
    emailForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      simulateLogin('João');
    });
  }
  const modalEmail = document.querySelector('#login-modal .modal-email-form');
  if(modalEmail){
    modalEmail.addEventListener('submit', (e)=>{
      e.preventDefault();
      simulateLogin('João');
      closeLoginModal();
    });
  }

  // Events page filtering
  const eventsScreen = document.getElementById('events-screen');
  if(eventsScreen){
    const searchInput = eventsScreen.querySelector('.search-section input');
    if(searchInput){
      let t; 
      searchInput.addEventListener('input', ()=>{
        clearTimeout(t);
        t = setTimeout(()=>{ filterState.query = searchInput.value.trim().toLowerCase(); applyFilters(); }, 150);
      });
    }

    eventsScreen.querySelectorAll('.filter-chip').forEach(chip=>{
      chip.addEventListener('click', ()=>{
        eventsScreen.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        filterState.type = chip.dataset.filter || 'all';
        applyFilters();
      });
    });
  }

  const API_URL = 'https://gridboard.onrender.com';
let currentUser = null;


function updateUIAfterLogin(user) {
    // Update header
    document.querySelector('.cta-login').style.display = 'none';
    const headerUser = document.getElementById('header-logged');
    headerUser.style.display = 'flex';
    // Use a generic avatar for email users
    headerUser.querySelector('.user-avatar').src = `https://i.pravatar.cc/40?u=${user.id}`;
    headerUser.querySelector('.user-name').textContent = user.name.split(' ')[0];

    // Update side menu
    const sideMenu = document.getElementById('side-menu');
    sideMenu.querySelector('.user-avatar').src = `https://i.pravatar.cc/50?u=${user.id}`;
    sideMenu.querySelector('.user-name').textContent = user.name;
    sideMenu.querySelector('.user-email').textContent = user.email;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('gridboard_user');
    // Reset UI to logged-out state
    document.querySelector('.cta-login').style.display = 'inline-flex';
    document.getElementById('header-logged').style.display = 'none';
    showScreen('home-screen');
}

// Check for saved user on page load
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('gridboard_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIAfterLogin(currentUser);
    }
});

// --- Modal Tab Switching ---
const loginModal = document.getElementById('login-modal');
loginModal.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.dataset.tab;

        // Update button active state
        loginModal.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update panel active state
        loginModal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        loginModal.querySelector(`#${tabId}`).classList.add('active');
    });
});

// --- Conventional Auth Form Handling ---
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('gridboard_user', JSON.stringify(user));
            updateUIAfterLogin(user);
            showScreen('home-screen');
        } else {
            alert('Erro ao registrar: ' + await response.text());
        }
    } catch (error) {
        alert('Erro de conexão ao tentar registrar.');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            localStorage.setItem('gridboard_user', JSON.stringify(user));
            updateUIAfterLogin(user);
            closeLoginModal();
        } else {
            alert('E-mail ou senha inválidos.');
        }
    } catch (error) {
        alert('Erro de conexão ao tentar fazer login.');
    }
});

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

// --- Championship Registration ---
async function registerForEvent(championshipId) {
    if (!currentUser) {
        alert('Você precisa estar logado para se inscrever.');
        openLoginModal();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${currentUser._id}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ championshipId })
        });
        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            localStorage.setItem('gridboard_user', JSON.stringify(updatedUser));
            alert('Inscrição realizada com sucesso!');
            // You might want to update the UI to show the user is registered
        } else {
            alert('Erro ao realizar inscrição.');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        alert('Erro de conexão ao tentar se inscrever.');
    }
}

// Handle Create Championship Form Submission
document.getElementById('create-championship-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        date: form.date.value,
        place: form.place.value,
        image: form.image.value
    };

    try {
        const response = await fetch(`${API_URL}/championships`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Campeonato cadastrado com sucesso!');
            form.reset();
            showScreen('home-screen');
        } else {
            alert('Erro ao cadastrar campeonato.');
        }
    } catch (error) {
        console.error('Submit Error:', error);
        alert(`Erro de conexão: ${error.message}`);
    }
});

// Parallax hero (desktop only)
  const heroMedia = document.querySelector('.desktop-hero-media');
  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  if(heroMedia){
    let ticking = false;
    const onScroll = ()=>{
      if(!desktopQuery.matches) { heroMedia.style.transform = ''; return; }
      if(ticking) return; ticking = true;
      requestAnimationFrame(()=>{
        const rect = heroMedia.getBoundingClientRect();
        const offset = Math.max(-80, Math.min(80, (window.scrollY || window.pageYOffset) * 0.12));
        // Apply subtle translateY for depth
        if(rect.bottom > 0) heroMedia.style.transform = `translateY(${offset}px)`;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
});

// Simple filter state
const filterState = { query: '', type: 'all' };

function syncFilterChips(){
  const screen = document.getElementById('events-screen');
  if(!screen) return;
  const active = filterState.type;
  screen.querySelectorAll('.filter-chip').forEach(c=>{
    c.classList.toggle('active', (c.dataset.filter||'all')===active);
  });
}

function applyFilters(){
  const list = document.querySelector('#events-screen .events-list');
  if(!list) return;
  const cards = list.querySelectorAll('.event-card');
  const q = filterState.query;
  const type = filterState.type;
  cards.forEach(card=>{
    const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
    const cType = (card.dataset.type || 'other');
    const matchesQuery = !q || title.includes(q);
    const matchesType = type==='all' || cType===type;
    card.style.display = (matchesQuery && matchesType) ? '' : 'none';
  });
}

// Google Identity Services callback
// This function is referenced by the data-callback attribute in index.html (g_id_onload)
// It receives an object with a JWT in credential. We decode it to personalize the UI.
function onGoogleSignIn(response){
  try {
    const { credential } = response || {};
    if(!credential){ throw new Error('Credencial do Google ausente.'); }
    const payload = decodeJwt(credential);
    const firstName = payload.given_name || payload.name || 'Piloto';
    // Personalize header state
    document.getElementById('header-not-logged').style.display = 'none';
    const headerLogged = document.getElementById('header-logged');
    headerLogged.style.display = 'flex';
    headerLogged.querySelector('.user-name').textContent = firstName;
    const avatarEl = headerLogged.querySelector('.user-avatar');
    if(payload.picture){ avatarEl.src = payload.picture; }
    showScreen('home-screen');
  } catch(err){
    console.error('Falha no login com Google:', err);
    alert('Não foi possível entrar com o Google.');
  }
}

// Minimal JWT decoder (no crypto verification; UI-only personalization)
function decodeJwt(token){
  const parts = token.split('.');
  if(parts.length !== 3) throw new Error('Token JWT inválido');
  const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
  return payload;
}
