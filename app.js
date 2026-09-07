* ============================================================
   HYDERABAD ESTATE VIP — Main App JS
   ============================================================ */

// ---- STATE ----
let allSocieties = [];
let allBrokers = [];
let allListings = [];
let allHousing = [];
let chatHistory = [];
let chatOpen = false;
let mapInstance = null;
let activeFlatTab = 'all'; // 'all' | 'rent' | 'sale'

// ---- AUTH STATE ----
let currentUser = null;
const token = () => localStorage.getItem('he_token');

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const t = token();
  if (t) {
    try {
      const res = await fetch('/api/auth/verify', { headers: { Authorization: 'Bearer ' + t } });
      const data = await res.json();
      if (data.user) {
        currentUser = data.user;
        openGate(); // User is authenticated, open the gate
        updateNavAuth();
        return;
      }
    } catch {}
  }
  // Show auth gate (user must login/register)
  document.getElementById('authGate').classList.remove('hidden');
});

// ============================================================
// AUTH GATE FUNCTIONS
// ============================================================
function openGate() {
  const gate = document.getElementById('authGate');
  gate.style.transition = 'opacity 0.4s';
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.classList.add('hidden');
    document.getElementById('mainContent').style.display = '';
    // Show ambient music button
    const ambBtn = document.getElementById('ambientTopBtn');
    if (ambBtn) ambBtn.style.display = 'flex';
    // Setup ambient auto-play
    setupAmbientAutoPlay();
    // Load all data
    loadSocieties(); loadBrokers(); loadListings(); loadHousing();
    renderFeatured();
    buildRatingTicker();
    buildShowcase4D();
    setTimeout(initBg3D, 500);
  }, 400);
}

function showGateRegister() {
  document.getElementById('gateLoginForm').style.display = 'none';
  document.getElementById('gateRegisterForm').style.display = 'block';
}

function showGateLogin() {
  document.getElementById('gateRegisterForm').style.display = 'none';
  document.getElementById('gateLoginForm').style.display = 'block';
}

async function doGateLogin() {
  const email = document.getElementById('gateLoginEmail').value;
  const password = document.getElementById('gateLoginPassword').value;
  const errEl = document.getElementById('gateLoginError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields'; errEl.style.display = 'block'; return; }
  
  // Demo login - accept any email/password
  const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  currentUser = { name, email };
  localStorage.setItem('he_token', 'demo_token_' + Date.now());
  updateNavAuth();
  openGate();
}

async function doGateRegister() {
  const name = document.getElementById('gateRegName').value;
  const email = document.getElementById('gateRegEmail').value;
  const phone = document.getElementById('gateRegPhone').value;
  const password = document.getElementById('gateRegPassword').value;
  const errEl = document.getElementById('gateRegError');
  errEl.style.display = 'none';
  if (!name || !email || !password) { errEl.textContent = 'Please fill in required fields'; errEl.style.display = 'block'; return; }
  
  // Demo register
  currentUser = { name, email, phone };
  localStorage.setItem('he_token', 'demo_token_' + Date.now());
  updateNavAuth();
  openGate();
}

// ============================================================
// AUTH
// ============================================================
function checkAuth() {
  const t = token();
  if (!t) return;
}

function updateNavAuth() {
  if (currentUser) {
    document.getElementById('navAuth').style.display = 'none';
    const nu = document.getElementById('navUser');
    nu.style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name[0].toUpperCase();
  } else {
    document.getElementById('navAuth').style.display = 'flex';
    document.getElementById('navUser').style.display = 'none';
  }
}

function openModal(type) {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('regError').style.display = 'none';
}

function closeAuthModal(e) {
  if (!e || e.target === document.getElementById('authModal')) {
    document.getElementById('authModal').classList.remove('open');
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  if (!email || !password) { errEl.textContent = 'Please fill in all fields'; errEl.style.display = 'block'; return; }
  const name = email.split('@')[0];
  currentUser = { name, email };
  localStorage.setItem('he_token', 'demo_' + Date.now());
  updateNavAuth();
  closeAuthModal();
  showToast('✓ Login successful! Welcome back, ' + name);
}

async function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('regError');
  if (!name || !email || !password) { errEl.textContent = 'Please fill in all fields'; errEl.style.display = 'block'; return; }
  currentUser = { name, email, phone };
  localStorage.setItem('he_token', 'demo_' + Date.now());
  updateNavAuth();
  closeAuthModal();
  showToast('✓ Account created! Welcome, ' + name);
}

function logout() {
  localStorage.removeItem('he_token');
  currentUser = null;
  updateNavAuth();
  const audio = getAmbientAudio();
  if (audio) { audio.pause(); audio.currentTime = 0; }
  ambientPlaying = false;
  ambientInitialized = false;
  const ambBtn = document.getElementById('ambientTopBtn');
  if (ambBtn) { ambBtn.style.display = 'none'; ambBtn.classList.remove('playing'); }
  document.getElementById('mainContent').style.display = 'none';
  const gate = document.getElementById('authGate');
  gate.classList.remove('hidden');
  gate.style.opacity = '1';
  showToast('Logged out successfully');
}

// ============================================================
// DATA LOADING - DEMO DATA
// ============================================================
async function loadSocieties() {
  allSocieties = [
    { id: 1, name: 'Boulevard Heights', name_urdu: 'بولیورڈ ہائٹس', location: 'Auto Bhan', type: 'Apartment Complex', featured: 1, rent_2bed_min: 35000, rent_2bed_max: 45000, rent_3bed_min: 50000, rent_3bed_max: 65000, sale_2bed_min: 5500000, sale_2bed_max: 7500000, sale_3bed_min: 8500000, sale_3bed_max: 12000000, sui_gas: 'Active', water_supply: 'WASA Connected', electricity: 'HESCO 3hrs load-shedding', amenities: 'Swimming Pool, Gym, Park, Security, 24/7 Water', latitude: 25.387, longitude: 68.310 },
    { id: 2, name: 'Defence Garden', name_urdu: 'ڈیفنس گارڈن', location: 'Cantt / Saddar', type: 'Luxury Apartments', featured: 1, rent_2bed_min: 40000, rent_2bed_max: 55000, rent_3bed_min: 60000, rent_3bed_max: 80000, sale_2bed_min: 6500000, sale_2bed_max: 9000000, sale_3bed_min: 10000000, sale_3bed_max: 14000000, sui_gas: 'Connected', water_supply: 'Private Tank', electricity: 'Minimal load-shedding', amenities: 'High Security, Gym, Park, Power Backup', latitude: 25.381, longitude: 68.378 },
    { id: 3, name: 'Jumeirah Heights', name_urdu: 'جمیرہ ہائٹس', location: 'Qasimabad', type: 'Premium Flats', rent_2bed_min: 38000, rent_2bed_max: 48000, rent_3bed_min: 55000, rent_3bed_max: 70000, sale_2bed_min: 7000000, sale_2bed_max: 9500000, sale_3bed_min: 11000000, sale_3bed_max: 15000000, sui_gas: 'Active', water_supply: 'WASA', electricity: '2hrs load-shedding', amenities: 'Gym, Park, Community Center', latitude: 25.420, longitude: 68.330 },
    { id: 4, name: 'Cantonment Plaza', name_urdu: 'کینٹنمنٹ پلازہ', location: 'Cantt', type: 'Commercial & Residential', rent_2bed_min: 42000, rent_2bed_max: 52000, rent_3bed_min: 65000, rent_3bed_max: 85000, sale_2bed_min: 8000000, sale_2bed_max: 11000000, sale_3bed_min: 12500000, sale_3bed_max: 17000000, sui_gas: 'Active', water_supply: 'Connected', electricity: 'Generators', amenities: 'Shopping Center, Parking, Security', latitude: 25.381, longitude: 68.368 },
    { id: 5, name: 'Royal Tower & Plaza', name_urdu: 'رائل ٹاور پلازہ', location: 'Qasimabad Main Road', type: 'Mixed Use', rent_2bed_min: 36000, rent_2bed_max: 46000, sale_2bed_min: 5200000, sale_2bed_max: 7200000, sui_gas: 'Connected', water_supply: 'WASA', electricity: '2hrs load-shedding', amenities: 'Shops, Offices, Park', latitude: 25.422, longitude: 68.328 },
    { id: 6, name: 'Wadhu Wah Avenue Tower', name_urdu: 'وادھو واہ ایونیو ٹاور', location: 'Latifabad', type: 'Luxury High-Rise', rent_2bed_min: 45000, rent_2bed_max: 60000, rent_3bed_min: 70000, rent_3bed_max: 95000, sale_2bed_min: 12500000, sale_2bed_max: 18000000, sale_3bed_min: 20000000, sale_3bed_max: 28000000, sui_gas: 'Active', water_supply: 'Private', electricity: 'Backup Power', amenities: 'Luxury Gym, Pool, Spa, 24/7 Security', latitude: 25.396, longitude: 68.352 },
  ];
  document.getElementById('statSocieties').textContent = allSocieties.length;
  document.getElementById('societyCount').textContent = allSocieties.length + ' buildings';
}

async function loadBrokers() {
  allBrokers = [
    { id: 1, name: 'Zahid Hussain', agency: 'Al Habib Real Estate', phone: '03013501356', tier: 'vip', color_tag: '#d4a853', rating: 5.0, verified: true, specialties: 'Flats, Plazas, Plots & Houses' },
    { id: 2, name: 'Muhammad Ali', agency: 'Elite Properties', phone: '03025678901', tier: 'premium', color_tag: '#38d9c0', rating: 4.8, verified: true, specialties: 'Apartments & Commercial' },
    { id: 3, name: 'Fatima Khan', agency: 'Dream Estate', phone: '03015432109', tier: 'premium', color_tag: '#38d9c0', rating: 4.7, verified: true, specialties: 'Residential & Plots' },
    { id: 4, name: 'Hassan Sheikh', agency: 'Property Plus', phone: '03034567890', tier: 'standard', color_tag: '#a78bfa', rating: 4.5, verified: false, specialties: 'Flats & Houses' },
    { id: 5, name: 'Ayesha Malik', agency: 'Sunrise Realty', phone: '03016789012', tier: 'standard', color_tag: '#a78bfa', rating: 4.6, verified: false, specialties: 'Apartments' },
  ];
  document.getElementById('statBrokers').textContent = allBrokers.length;
}

async function loadListings() {
  allListings = [
    { id: 1, title: 'Spacious 2-Bed Flat', society_name: 'Boulevard Heights', society_location: 'Auto Bhan', type: 'rent', bedrooms: 2, size_sqft: 1200, price: 38000, broker_name: 'Zahid Hussain', broker_phone: '03013501356' },
    { id: 2, title: 'Luxury 3-Bed Apartment', society_name: 'Boulevard Heights', society_location: 'Auto Bhan', type: 'sale', bedrooms: 3, size_sqft: 1800, price: 9500000, broker_name: 'Muhammad Ali', broker_phone: '03025678901' },
    { id: 3, title: 'Cozy 2-Bed Flat', society_name: 'Defence Garden', society_location: 'Cantt', type: 'rent', bedrooms: 2, size_sqft: 1150, price: 45000, broker_name: 'Fatima Khan', broker_phone: '03015432109' },
    { id: 4, title: 'Premium 3-Bed Penthouse', society_name: 'Jumeirah Heights', society_location: 'Qasimabad', type: 'sale', bedrooms: 3, size_sqft: 2200, price: 14000000, broker_name: 'Zahid Hussain', broker_phone: '03013501356' },
    { id: 5, title: 'Modern 2-Bed Flat', society_name: 'Cantonment Plaza', society_location: 'Cantt', type: 'rent', bedrooms: 2, size_sqft: 1300, price: 42000, broker_name: 'Hassan Sheikh', broker_phone: '03034567890' },
    { id: 6, title: 'Exclusive 3-Bed Apartment', society_name: 'Royal Tower', society_location: 'Qasimabad', type: 'sale', bedrooms: 3, size_sqft: 1900, price: 8500000, broker_name: 'Ayesha Malik', broker_phone: '03016789012' },
    { id: 7, title: 'Luxury 2-Bed Studio', society_name: 'Wadhu Wah Avenue', society_location: 'Latifabad', type: 'rent', bedrooms: 2, size_sqft: 1400, price: 50000, broker_name: 'Muhammad Ali', broker_phone: '03025678901' },
  ];
  document.getElementById('statListings').textContent = allListings.length + '+';
}

async function loadHousing() {
  allHousing = [
    { id: 1, name: 'GULSHAN-E-ZEALPAK', location: 'Hyderabad Bypass', available_sizes: '5 Marla, 10 Marla, 1 Kanal', total_plots: '2000+', road_width: '100ft, 80ft', estimated_rates: 'PKR 1.8 – 3.5 Lac per Marla', sui_gas: 'Available', electricity: 'HESCO Connected', water_supply: 'Tube wells', masjid: 'Under construction', amenities: 'Park, School, Clinic' },
    { id: 2, name: 'SAIMA DOWNTOWN', location: 'Qasimabad', available_sizes: '3 Marla, 5 Marla', total_plots: '1500+', road_width: '60ft, 40ft', estimated_rates: 'PKR 2.2 – 4.0 Lac per Marla', sui_gas: 'Active', electricity: 'Connected', water_supply: 'Installed', masjid: 'Completed', amenities: 'Market, Park, Security' },
    { id: 3, name: 'PALM VILLAGE', location: 'Latifabad', available_sizes: '5 Marla, 10 Marla', total_plots: '800+', road_width: '80ft', estimated_rates: 'PKR 2.5 – 4.5 Lac per Marla', sui_gas: 'Available', electricity: 'Available', water_supply: 'Planned', masjid: 'Planned', amenities: 'Swimming pool, Gym' },
    { id: 4, name: 'CITIZEN COLONY', location: 'Cantt', available_sizes: '3 Marla, 5 Marla', total_plots: '1200+', road_width: '60ft', estimated_rates: 'PKR 2.0 – 3.8 Lac per Marla', sui_gas: 'Connected', electricity: 'Connected', water_supply: 'Connected', masjid: 'Completed', amenities: 'Park, Shops' },
    { id: 5, name: 'ROHAAN FARAZ', location: 'Site Area', available_sizes: '10 Marla, 1 Kanal', total_plots: '500+', road_width: '100ft', estimated_rates: 'PKR 1.5 – 2.8 Lac per Marla', sui_gas: 'Planned', electricity: 'Planned', water_supply: 'Planned', masjid: 'Planned', amenities: 'Green belt' },
  ];
  const el = document.getElementById('housingCount');
  if (el) el.textContent = allHousing.length + ' societies';
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name) {
  document.getElementById('sectionHome').style.display = 'none';
  document.getElementById('sectionFeatured').style.display = 'none';
  document.getElementById('sectionSocieties').style.display = 'none';
  document.getElementById('sectionFlats').style.display = 'none';
  document.getElementById('sectionHousing').style.display = 'none';
  document.getElementById('sectionBrokers').style.display = 'none';
  document.getElementById('sectionMap').style.display = 'none';
  document.getElementById('showcase4d').style.display = 'none';

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (name === 'home') {
    document.getElementById('sectionHome').style.display = '';
    document.getElementById('sectionFeatured').style.display = '';
    document.querySelector('[onclick="showSection(\'home\')"]').classList.add('active');
  } else if (name === 'societies') {
    document.getElementById('sectionSocieties').style.display = '';
    renderSocieties(allSocieties);
    document.querySelector('[onclick="showSection(\'societies\')"]').classList.add('active');
  } else if (name === 'flats') {
    document.getElementById('sectionFlats').style.display = '';
    document.getElementById('showcase4d').style.display = '';
    activeFlatTab = 'all';
    resetFlatTabs();
    applyFlatFilters();
    document.querySelector('[onclick="showSection(\'flats\')"]').classList.add('active');
  } else if (name === 'housing') {
    document.getElementById('sectionHousing').style.display = '';
    renderHousing(allHousing);
    document.querySelector('[onclick="showSection(\'housing\')"]').classList.add('active');
  } else if (name === 'brokers') {
    document.getElementById('sectionBrokers').style.display = '';
    renderBrokers(allBrokers);
    document.querySelector('[onclick="showSection(\'brokers\')"]').classList.add('active');
  } else if (name === 'map') {
    document.getElementById('sectionMap').style.display = '';
    document.querySelector('[onclick="showSection(\'map\')"]').classList.add('active');
    setTimeout(initMap, 100);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ============================================================
// SEARCH
// ============================================================
function doSearch() {
  const type = document.getElementById('hsType').value;
  const beds = document.getElementById('hsBeds').value;
  showSection('flats');
  setTimeout(() => {
    if (type) {
      activeFlatTab = type;
      resetFlatTabs();
    }
    if (beds) document.getElementById('flatBedFilter').value = beds;
    applyFlatFilters();
  }, 80);
}

function switchFlatTab(tab) {
  activeFlatTab = tab;
  resetFlatTabs();
  applyFlatFilters();
}

function resetFlatTabs() {
  ['tabAll', 'tabRent', 'tabSale'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const map = { all: 'tabAll', rent: 'tabRent', sale: 'tabSale' };
  const target = document.getElementById(map[activeFlatTab]);
  if (target) target.classList.add('active');
}

function applyFlatFilters() {
  const beds   = document.getElementById('flatBedFilter')?.value || '';
  const area   = document.getElementById('flatAreaFilter')?.value || '';
  const search = (document.getElementById('flatSearch')?.value || '').toLowerCase();

  let filtered = allListings;

  if (activeFlatTab !== 'all') {
    filtered = filtered.filter(l => l.type === activeFlatTab);
  }
  if (beds) filtered = filtered.filter(l => l.bedrooms === parseInt(beds));
  if (area) filtered = filtered.filter(l =>
    (l.society_location || '').toLowerCase().includes(area.toLowerCase())
  );
  if (search) filtered = filtered.filter(l =>
    (l.title || '').toLowerCase().includes(search) ||
    (l.society_name || '').toLowerCase().includes(search)
  );

  const countBar = document.getElementById('flatCountBar');
  if (countBar) {
    const rentCount = filtered.filter(l => l.type === 'rent').length;
    const saleCount = filtered.filter(l => l.type === 'sale').length;
    countBar.textContent = `Showing ${filtered.length} flat${filtered.length !== 1 ? 's' : ''} — ${rentCount} For Rent · ${saleCount} For Sale`;
  }

  renderListings(filtered);
}

function filterSocieties(query) {
  const q = query.toLowerCase();
  renderSocieties(allSocieties.filter(s =>
    s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)
  ));
}

function filterSocietiesByArea(area) {
  if (!area) { renderSocieties(allSocieties); return; }
  renderSocieties(allSocieties.filter(s => s.location.toLowerCase().includes(area.toLowerCase())));
}

function renderHousing(list) {
  const grid = document.getElementById('housingGrid');
  if (!grid) return;
  const bar = document.getElementById('housingCountBar');
  if (bar) bar.textContent = `Showing ${list.length} housing societ${list.length !== 1 ? 'ies' : 'y'}`;

  if (!list.length) {
    grid.innerHTML = '<div style="color:var(--text3);text-align:center;padding:60px;grid-column:1/-1">No societies found.</div>';
    return;
  }
  grid.innerHTML = list.map((h, i) => `
    <div class="housing-card">
      <div class="housing-card-header">
        <div class="housing-card-num">${h.id}</div>
        <div style="flex:1">
          <div class="housing-card-title">${h.name}</div>
          <div class="housing-card-location">📍 ${h.location}</div>
        </div>
      </div>
      <div class="housing-card-body">
        <div class="housing-row"><span class="housing-row-label">Plot Sizes</span><span class="housing-row-val">${h.available_sizes}</span></div>
        <div class="housing-rates">${h.estimated_rates}</div>
        <div class="housing-row"><span class="housing-row-label">Road Width</span><span class="housing-row-val">${h.road_width}</span></div>
        <div class="housing-row"><span class="housing-row-label">🔥 Sui Gas</span><span class="housing-row-val">${h.sui_gas}</span></div>
        <div class="housing-row"><span class="housing-row-label">⚡ Electricity</span><span class="housing-row-val">${h.electricity}</span></div>
      </div>
      <div class="housing-card-footer">
        <span class="housing-plots-badge">🏘️ Housing</span>
        <a href="tel:03013501356" class="btn-contact-broker">📞 Contact</a>
      </div>
    </div>
  `).join('');
}

function filterHousing(query) {
  const q = query.toLowerCase();
  renderHousing(allHousing.filter(h =>
    h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q)
  ));
}

function filterHousingByArea(area) {
  if (!area) { renderHousing(allHousing); return; }
  renderHousing(allHousing.filter(h => h.location.toLowerCase().includes(area.toLowerCase())));
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function formatPrice(n) {
  if (!n) return 'N/A';
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Crore';
  if (n >= 100000) return (n / 100000).toFixed(0) + ' Lac';
  return 'PKR ' + n.toLocaleString();
}

function formatMonthly(n) {
  if (!n) return 'N/A';
  return 'PKR ' + n.toLocaleString() + '/mo';
}

function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + ` (${rating})`;
}

const BUILDING_ICONS = ['🏢', '🏙️', '🌆', '🏗️', '🏬', '🏛️', '🌇', '🏠', '🏡', '🏘️'];

function societyCardHtml(s, idx) {
  const icon = BUILDING_ICONS[idx % BUILDING_ICONS.length];
  return `
    <div class="society-card ${s.featured ? 'featured' : ''}" onclick="openSocietyDetail(${s.id})">
      <div class="card-img"><span style="font-size:4rem">${icon}</span><div class="card-img-num"># ${idx + 1}</div></div>
      <div class="card-body">
        <div class="card-name">${s.name}</div>
        <div class="card-location">📍 ${s.location}</div>
        <div class="price-grid">
          <div class="price-box">
            <div class="price-label">2-Bed Rent</div>
            <div class="price-val">${s.rent_2bed_min ? 'PKR ' + (s.rent_2bed_min/1000).toFixed(0) + 'k–' + (s.rent_2bed_max/1000).toFixed(0) + 'k' : '—'}</div>
          </div>
          <div class="price-box">
            <div class="price-label">2-Bed Sale</div>
            <div class="price-val">${formatPrice(s.sale_2bed_min)}</div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-detail">View Details →</button>
      </div>
    </div>
  `;
}

function renderFeatured() {
  const featured = allSocieties.filter(s => s.featured === 1);
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = featured.map((s, i) => societyCardHtml(s, allSocieties.indexOf(s))).join('');
}

function renderSocieties(list) {
  document.getElementById('societiesGrid').innerHTML = list.length
    ? list.map((s, i) => societyCardHtml(s, i)).join('')
    : '<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:60px">No societies found.</p>';
}

function renderBrokers(list) {
  document.getElementById('brokersGrid').innerHTML = list.map(b => `
    <div class="broker-card ${b.tier}">
      <div class="broker-tier-dot" style="background:${b.color_tag || '#4A90D9'}"></div>
      <div class="broker-name">${b.name}</div>
      <div class="broker-agency">${b.agency || 'Independent'}</div>
      <div class="broker-stars">${starsHtml(b.rating)}</div>
      ${b.verified ? '<div class="broker-verified">✓ Verified</div>' : ''}
      <div class="broker-phone-row">
        <a href="tel:${b.phone}" class="broker-btn-call">📞 Call</a>
        <a href="https://wa.me/92${b.phone.substring(1)}" target="_blank" class="broker-btn-whatsapp">💬 WhatsApp</a>
      </div>
      <div class="broker-phone-num">📞 ${b.phone}</div>
    </div>
  `).join('');
}

function renderListings(list) {
  document.getElementById('listingsGrid').innerHTML = list.map(l => `
    <div class="listing-card">
      <div class="listing-type ${l.type}">${l.type === 'rent' ? '🏠 FOR RENT' : '🏷️ FOR SALE'}</div>
      <div class="listing-title">${l.title}</div>
      <div class="listing-society">📍 ${l.society_name} — ${l.society_location}</div>
      <div class="listing-price">${l.type === 'rent' ? formatMonthly(l.price) : formatPrice(l.price)}</div>
      <div class="listing-broker">
        <div class="broker-mini-avatar">${(l.broker_name || 'Z')[0]}</div>
        <div>
          <div class="broker-mini-name">${l.broker_name}</div>
          <div class="broker-mini-phone">${l.broker_phone}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// SOCIETY DETAIL MODAL
// ============================================================
function openSocietyDetail(id) {
  const s = allSocieties.find(x => x.id === id);
  if (!s) return;

  const html = `
    <div class="detail-header">
      <div class="detail-name">${s.name}</div>
      <div class="detail-location">📍 ${s.location}</div>
    </div>
    <div class="detail-section">
      <h4>💰 Pricing</h4>
      <div class="price-table">
        <div class="price-cell"><div class="price-cell-label">2-Bed Rent/Month</div><div class="price-cell-val">PKR ${s.rent_2bed_min} – ${s.rent_2bed_max}</div></div>
        <div class="price-cell"><div class="price-cell-label">2-Bed Sale</div><div class="price-cell-val">${formatPrice(s.sale_2bed_min)}</div></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>🏗️ Infrastructure</h4>
      <div class="infra-table">
        <div class="infra-row"><div class="infra-icon">⛽</div><div><div class="infra-label">Sui Gas</div><div class="infra-val">${s.sui_gas}</div></div></div>
        <div class="infra-row"><div class="infra-icon">💧</div><div><div class="infra-label">Water</div><div class="infra-val">${s.water_supply}</div></div></div>
      </div>
    </div>
  `;

  document.getElementById('societyModalContent').innerHTML = html;
  document.getElementById('societyModal').classList.add('open');
}

function closeSocietyModal(e) {
  if (!e || e.target === document.getElementById('societyModal')) {
    document.getElementById('societyModal').classList.remove('open');
  }
}

// ============================================================
// MAP - SIMPLE
// ============================================================
function initMap() {
  const mapDiv = document.getElementById('map');
  if (!mapDiv || typeof L === 'undefined') return;
  if (mapInstance) { mapInstance.invalidateSize(); return; }
  
  mapInstance = L.map('map').setView([25.396, 68.345], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
}

// ============================================================
// RATING TICKER
// ============================================================
function buildRatingTicker() {
  const items = [
    '⭐⭐⭐⭐⭐ Zahid Hussain Al Habib Real Estate — 03013501356',
    '🏆 Boulevard Heights — Luxury Apartments',
    '⭐⭐⭐⭐ Defence Garden — High Security',
    '🏢 Jumeirah Heights — Premium Flats in Qasimabad',
    '⭐⭐⭐⭐ Royal Tower — Mixed Use',
  ];
  const doubled = [...items, ...items];
  document.getElementById('ratingTicker').innerHTML =
    doubled.map(t => `<span class="ticker-item">${t}</span>`).join('');
}

// ============================================================
// CHATBOT
// ============================================================
function toggleChat() {
  chatOpen = !chatOpen;
  const widget = document.getElementById('chatWidget');
  if (chatOpen) {
    widget.classList.add('open');
    document.getElementById('chatInput').focus();
  } else {
    widget.classList.remove('open');
  }
}

function chatKeypress(e) {
  if (e.key === 'Enter') sendChat();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendMsg('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  // Demo reply
  setTimeout(() => {
    const reply = 'Thank you for your interest! Hyderabad Estate offers premium flats and plots with verified brokers. Contact us at 03013501356 for more details.';
    appendMsg('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
  }, 800);
}

function appendMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  const formatted = text.replace(/\n/g, '<br>');
  div.innerHTML = `<div class="msg-bubble">${formatted}</div>`;
  const msgs = document.getElementById('chatMsgs');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ============================================================
// 4D SHOWCASE
// ============================================================
const showcaseImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80',
  'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=600&q=80',
];

function buildShowcase4D() {
  const grid = document.getElementById('showcaseGrid');
  if (!grid || !allListings.length) return;
  const picks = allListings.slice(0, 4);
  grid.innerHTML = picks.map((f, i) => {
    const img = showcaseImages[i % showcaseImages.length];
    const typeLabel = f.type === 'rent' ? '🏠 For Rent' : '🏷️ For Sale';
    const priceText = f.type === 'rent' ? 'PKR ' + f.price.toLocaleString() + '/mo' : 'PKR ' + f.price.toLocaleString();
    return `<div class="showcase-card">
      <img src="${img}" class="showcase-card-img" alt="${f.title}" />
      <div class="showcase-card-body">
        <div class="showcase-card-name">${f.title}</div>
        <div class="showcase-card-loc">📍 ${f.society_name}</div>
        <div class="showcase-card-info">
          <div class="showcase-card-stat"><div class="showcase-card-stat-label">Price</div><div class="showcase-card-stat-val">${priceText}</div></div>
          <div class="showcase-card-stat"><div class="showcase-card-stat-label">Beds</div><div class="showcase-card-stat-val">${f.bedrooms} Bed</div></div>
        </div>
        <div class="showcase-card-actions">
          <button class="showcase-btn-copy" onclick="alert('Details: ' + '${f.title}\\n${typeLabel}\\n${priceText}')">📋 Copy</button>
          <button class="showcase-btn-ai" onclick="alert('AI Agent: Tell me about ' + '${f.society_name}')">🤖 AI</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ============================================================
// 3D BACKGROUND
// ============================================================
function initBg3D() {
  // Demo: just add some basic CSS animation
  const bg = document.getElementById('bg3d');
  if (bg) {
    bg.style.background = 'radial-gradient(ellipse at 20% 30%, rgba(212,168,83,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(56,217,192,0.05) 0%, transparent 50%)';
  }
}

// ============================================================
// AMBIENT MUSIC
// ============================================================
let ambientPlaying = false;
let ambientInitialized = false;

function getAmbientAudio() {
  return document.getElementById('ambientAudio');
}

function setupAmbientAutoPlay() {
  // Simple setup
}

function toggleAmbientMusic() {
  const audio = getAmbientAudio();
  if (!audio) return;
  
  const btn = document.getElementById('ambientTopBtn');
  const icon = document.getElementById('ambientTopIcon');
  const label = document.getElementById('ambientTopLabel');
  
  if (ambientPlaying) {
    audio.pause();
    ambientPlaying = false;
    btn.classList.remove('playing');
    icon.textContent = '🔇';
    label.textContent = 'Music OFF';
  } else {
    audio.volume = 0.2;
    audio.play().catch(() => {});
    ambientPlaying = true;
    btn.classList.add('playing');
    icon.textContent = '🎵';
    label.textContent = 'Music ON';
  }
}
