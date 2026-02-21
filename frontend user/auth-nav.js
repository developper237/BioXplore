/**
 * auth-nav.js — BioXplore
 * Injecte les infos du user connecté dans la navbar de toutes les pages.
 * Gère aussi l'affichage du dropdown "guest" (non connecté).
 */

(function initAuthNav() {
  const API_URL = 'http://localhost:5000';

  function getToken() { return localStorage.getItem('accessToken'); }
  function getUser()  {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch(e) { return null; }
  }
  function isLoggedIn() { return !!getToken(); }

  // Remplit tous les éléments [data-auth="*"] dans la page
  function fillUserUI(user) {
    if (!user) return;
    const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'My Account';
    const initials = (user.first_name?.[0] || '') + (user.last_name?.[0] || '');
    const role     = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';

    document.querySelectorAll('[data-auth="name"]').forEach(el => el.textContent = fullName);
    document.querySelectorAll('[data-auth="role"]').forEach(el => el.textContent = role);
    document.querySelectorAll('[data-auth="initials"]').forEach(el => el.textContent = initials || '?');
    document.querySelectorAll('[data-auth="email"]').forEach(el => el.textContent = user.email || '');

    // Compatibilité avec les IDs existants
    ['userName', 'userNameDesktop', 'userNameMobile', 'navUserName'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = fullName;
    });
  }

  // Affichage conditionnel selon l'état de connexion (utilisé dans home.html etc.)
  function updateAuthUI() {
    const loggedIn = isLoggedIn();

    // Dropdown connecté / guest (home.html)
    const ddAuth  = document.getElementById('userDropdown');
    const ddGuest = document.getElementById('userDropdownGuest');
    const userInfo = document.querySelector('.user-info');

    if (ddAuth)   ddAuth.style.display   = loggedIn ? '' : 'none';
    if (ddGuest)  ddGuest.style.display  = loggedIn ? 'none' : '';
    if (userInfo) userInfo.style.display = loggedIn ? '' : 'none';

    // Section mobile (menu overlay) : afficher login ou profil/logout
    const mobileUserSection = document.querySelector('.mobile-user-section');
    if (mobileUserSection) {
      if (loggedIn) {
        // Déjà géré par fillUserUI
        mobileUserSection.querySelector('.mobile-user-info')?.style && (mobileUserSection.querySelector('.mobile-user-info').style.display = '');
        const authBtns = mobileUserSection.querySelector('.mobile-auth-buttons');
        if (authBtns) {
          authBtns.innerHTML = `
            <a href="profile.html" class="mobile-auth-btn mobile-btn-login">My Profile</a>
            <a href="logout.html"  class="mobile-auth-btn mobile-btn-signup">Log Out</a>`;
        }
      } else {
        const userInfoMobile = mobileUserSection.querySelector('.mobile-user-info');
        if (userInfoMobile) userInfoMobile.style.display = 'none';
        const authBtns = mobileUserSection.querySelector('.mobile-auth-buttons');
        if (authBtns) {
          authBtns.innerHTML = `
            <a href="login.html"  class="mobile-auth-btn mobile-btn-signup" style="flex:1;text-align:center;">Log In</a>`;
        }
      }
    }
  }

  // Rafraîchit le profil depuis l'API
  async function refreshUser() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('unauthorized');
      const data = await res.json();
      if (data.success && data.data?.user) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        return data.data.user;
      }
    } catch(e) { /* serveur off : on utilise le cache */ }
    return null;
  }

  async function run() {
    // 1. Affichage immédiat depuis le cache
    updateAuthUI();
    const cached = getUser();
    if (cached) fillUserUI(cached);

    // 2. Rafraîchissement API en arrière-plan
    const fresh = await refreshUser();
    if (fresh) {
      fillUserUI(fresh);
      updateAuthUI();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();