// ════════ INSTITUTIONAL PORTAL CORE ════════
let activeRole = ''; // col-admin | faculty | col-student
let activeCollege = '';
let activeUser = null;
const API_HOST = window.location.hostname === 'localhost' ? 'localhost:5000' : `${window.location.hostname}:5000`;
const API_BASE = `http://${API_HOST}/api`;

/**
 * 🛰️ SECURE FETCH WRAPPER
 * Ensures credentials (cookies) are included in all requests
 */
async function apiFetch(endpoint, options = {}) {
  const origin = window.location.origin;
  // Fallback to hardcoded API_BASE if running as file or on different port (Dev mode)
  let baseUrl = `${origin}/api`;
  if (origin === 'null' || !origin.includes(':5000')) {
    baseUrl = API_BASE;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  const mergedOptions = { ...defaultOptions, ...options };
  if (options.headers) mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };

  try {
    console.log(`[NETWORK] Fetching: ${url}`);
    const res = await fetch(url, mergedOptions);
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { success: res.ok, message: text };
    }

    // Automatic session clearing on invalid token
    if (res.status === 401 && (data.message === 'Invalid token' || data.message === 'Token expired')) {
      console.warn('[AUTH] Invalid session detected. Clearing...');
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      if (!endpoint.includes('/me')) window.location.reload();
    }

    if (!res.ok) throw new Error(data.message || `Server error: ${res.status}`);
    return data;
  } catch (error) {
    console.error(`[NETWORK ERROR] ${endpoint}:`, error.message);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      if (typeof showToast !== 'undefined') {
        showToast('Backend server unreachable. Please ensure the API is running on port 5000.', 'error');
      }
    }
    return { success: false, message: error.message };
  }
}

// ════════ PREMIUM PERSISTENCE SYSTEM (State Manager) ════════
let localPersistentState = {
  activeScreen: 'dash',
  lastVisitedModule: null,
  preferences: { theme: 'light' },
  progress: {
    resumeData: {},
    jobApplications: [],
    mockTests: [],
    interviews: [],
    placement: {}
  }
};

/**
 * 💓 HEARTBEAT: Auto-save state to cloud every 30 seconds
 */
function startInstitutionalHeartbeat() {
  if (window.skHeartbeatTimer) clearInterval(window.skHeartbeatTimer);
  window.skHeartbeatTimer = setInterval(async () => {
    if (!activeUser) return;

    try {
      await apiFetch('/userdata', {
        method: 'POST',
        body: JSON.stringify({
          preferences: localPersistentState.preferences,
          progress: localPersistentState.progress,
          savedData: {
            lastAccessedPage: localPersistentState.activeScreen,
            recentSearches: [],
            pinnedModules: []
          }
        })
      });

      // 📊 DYNAMIC DATA: Refresh Tracker if on faculty tracker screen
      if (localPersistentState.activeScreen === 'fac-tracker' && typeof loadFacultyTracker === 'function') {
        loadFacultyTracker();
      }

      console.log('[HEARTBEAT] State synced to cloud');
    } catch (e) {
      console.warn('[HEARTBEAT] Sync failed (offline)');
    }
  }, 30000);
}

// ════════ GOOGLE AUTH INITIALIZATION ════════
function initGoogleAuth() {
  document.querySelectorAll('.google-login-btn-container').forEach(container => {
    container.style.display = 'none';
  });
}

async function handleGoogleCredentialResponse(response) {
  showToast('Authenticating with Google...');
  try {
    const role = window.lastGoogleLoginRole || 'faculty';
    const result = await apiFetch('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({
        credential: response.credential,
        role: role === 'col-admin' ? 'college_admin' : 'faculty'
      })
    });

    if (result.success) {
      _enterInstitutionalUI(role, result.data.user);
      startInstitutionalHeartbeat();
    } else {
      showToast(result.message || 'Verification failed');
    }
  } catch (e) {
    console.error('Auth Connection Error:', e);
    showToast('Login Failed: ' + e.message);
    if (e.message.toLowerCase().includes('failed to fetch')) {
      alert('Backend connection failed! Ensure your API server is running at http://localhost:5000');
    }
  }
}

// Google login has been removed in the migrated app.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoogleAuth);
} else {
  initGoogleAuth();
}

// ════════ INSTITUTIONAL AUTH UI TOGGLES ════════
function toggleInstSignup(role, isSignup) {
  const loginView = document.getElementById(`${role}-login-view`);
  const signupView = document.getElementById(`${role}-signup-view`);
  if (isSignup) {
    loginView.style.display = 'none';
    signupView.style.display = 'block';
  } else {
    loginView.style.display = 'block';
    signupView.style.display = 'none';
  }
}

async function doInstForgotPassword(portal) {
  let emailId = '';
  if (portal === 'student') emailId = 'inst-rollno';
  else if (portal === 'faculty') emailId = 'inst-fac-email';
  else emailId = 'inst-adm-id';

  const email = document.getElementById(emailId).value.trim();
  if (!email) {
    showToast(`Please enter your ${portal === 'student' ? 'Roll No' : 'Email'} first`);
    return;
  }

  showToast('Processing recovery...');
  try {
    const result = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.includes('@') ? email : `${email}@college.edu` })
    });
    if (result.success) {
      alert('Recovery link has been sent to ' + email);
    } else {
      showToast(result.message || 'Recovery failed');
    }
  } catch (e) {
    showToast('Recovery connection failed');
  }
}

// ════════ INSTITUTIONAL REGISTRATION ════════
async function doFacultyRegister() {
  const name = document.getElementById('inst-fac-reg-name').value.trim();
  const email = document.getElementById('inst-fac-reg-email').value.trim();
  const displayEl = document.getElementById('sk-val-fac-reg');
  const collegeName = displayEl?.textContent?.trim();
  const collegeId = displayEl?.dataset?.collegeId;
  const password = document.getElementById('inst-fac-reg-pass').value.trim();
  const confirmPass = document.getElementById('inst-fac-reg-pass-confirm').value.trim();
  const errEl = document.getElementById('inst-fac-reg-err');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (!name || !email || !password) {
    if (errEl) { errEl.textContent = 'All fields are required'; errEl.style.display = 'block'; }
    return;
  }

  if (!collegeName || collegeName.toLowerCase().includes('choose')) {
    if (errEl) { errEl.textContent = 'Please select your institution'; errEl.style.display = 'block'; }
    return;
  }

  if (password !== confirmPass) {
    if (errEl) { errEl.textContent = 'Passphrases do not match'; errEl.style.display = 'block'; }
    return;
  }

  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, collegeName, collegeId, password, role: 'faculty' })
    });
    if (result.success) {
      showToast('Registration successful! Welcome Faculty.');
      _enterInstitutionalUI('faculty', result.data.user);
      startInstitutionalHeartbeat();
    } else {
      throw new Error(result.message || 'Registration failed');
    }
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    } else {
      showToast(e.message);
    }
  }
}

async function doAdminRegister() {
  const name = document.getElementById('inst-adm-reg-name').value.trim();
  const email = document.getElementById('inst-adm-reg-email').value.trim();
  const displayEl = document.getElementById('sk-val-adm-reg');
  const collegeName = displayEl?.textContent?.trim();
  const collegeId = displayEl?.dataset?.collegeId;
  const password = document.getElementById('inst-adm-reg-pass').value.trim();
  const confirmPass = document.getElementById('inst-adm-reg-pass-confirm').value.trim();
  const errEl = document.getElementById('inst-adm-reg-err');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (!name || !email || !password) {
    if (errEl) { errEl.textContent = 'All fields are required'; errEl.style.display = 'block'; }
    return;
  }

  if (!collegeName || collegeName.toLowerCase().includes('choose')) {
    if (errEl) { errEl.textContent = 'Please select your institution'; errEl.style.display = 'block'; }
    return;
  }

  if (password !== confirmPass) {
    if (errEl) { errEl.textContent = 'Passphrases do not match'; errEl.style.display = 'block'; }
    return;
  }

  try {
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, collegeName, collegeId, password, role: 'college_admin' })
    });
    if (result.success) {
      showToast('Onboarding complete! Welcome Admin.');
      _enterInstitutionalUI('col-admin', result.data.user);
      startInstitutionalHeartbeat();
    } else {
      throw new Error(result.message || 'Onboarding failed');
    }
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    } else {
      showToast(e.message);
    }
  }
}

// ════════ PLATFORM ADMIN REVEAL ════════
function revealPlatformAdmin() {
  console.log('[MASTER] Attempting to reveal Platform Admin Modal...');
  const modal = document.getElementById('platform-admin-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('plat-pass')?.focus();
    console.log('[MASTER] Modal displayed successfully');
  } else {
    console.error('[MASTER] Fatal Error: platform-admin-modal not found in DOM');
  }
}

// ════════ LOGIN HANDLERS (Backend Integrated) ════════
async function doStudentCollegeLogin() {
  const roll = document.getElementById('inst-rollno').value.trim().toUpperCase();
  const pass = document.getElementById('inst-student-pass').value.trim();
  const collegeName = document.getElementById('sk-val-learner').textContent;
  const errEl = document.getElementById('inst-student-err');

  if (collegeName.includes('Choose')) {
    if (errEl) { errEl.textContent = 'Select your college'; errEl.style.display = 'block'; }
    return;
  }
  if (!roll) {
    if (errEl) { errEl.textContent = 'Enter Roll No.'; errEl.style.display = 'block'; }
    return;
  }

  showToast('Authenticating...');

  try {
    const collegeId = document.getElementById('sk-val-learner')?.dataset.collegeId;

    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        studentId: roll,
        password: pass,
        role: 'student',
        collegeName: collegeName,
        collegeId: collegeId
      })
    });

    if (result.success) {
      _enterInstitutionalUI('col-student', result.data.user);
      await syncStudentData(roll, collegeName, true);
      startInstitutionalHeartbeat();
    }
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  }
}

/**
 * 🌊 DATA HYDRAULICS: Fetches Full Student Profile and hydrates global states
 */
async function syncStudentData(roll, collegeName, showOverlay = true) {
  let syncOverlay = null;
  if (showOverlay) {
    syncOverlay = document.createElement('div');
    syncOverlay.id = 'inst-sync-overlay';
    syncOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.8);backdrop-filter:blur(10px);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:inherit';
    syncOverlay.innerHTML = `
      <div class="institutional-login-card" style="position:relative; width:100%; max-width:440px; background:rgba(255,255,255,0.94); backdrop-filter:blur(24px); border-radius:28px; padding:24px 28px; border:1px solid rgba(255,255,255,0.4); box-shadow:0 30px 70px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.3); overflow:visible; margin: auto; max-height: calc(100vh - 40px); display: flex; flex-direction: column;">
      <div class="loader-ring" style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite"></div>
      <div style="margin-top:16px;font-weight:600;letter-spacing:0.5px">Synchronizing Student Data...</div>
      <div style="font-size:12px;opacity:0.6;margin-top:4px">Establishing Zero-Clash Connection to ${collegeName}</div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
      </div>
    `;
    document.body.appendChild(syncOverlay);
  }

  try {
    const syncData = await apiFetch('/students/identify', {
      method: 'POST',
      body: JSON.stringify({ college_id: collegeName, roll_no: roll })
    });

    if (syncOverlay) syncOverlay.remove();

    if (syncData.success) {
      if (typeof currentUser !== 'undefined') {
        Object.assign(currentUser, syncData.student);

        const testHistory = syncData.history.tests || [];
        currentUser.testHistory = testHistory;
        currentUser.testsCompleted = testHistory.length;

        if (testHistory.length > 0) {
          currentUser.avgAccuracy = Math.round(testHistory.reduce((a, b) => a + (b.percentage || 0), 0) / testHistory.length);

          // 📊 DEEP HYDRATION: Populate practiceScores for Charts
          currentUser.practiceScores = { quant: [], logical: [], verbal: [], di: [] };
          testHistory.forEach(t => {
            if (t.sections && t.sections.length > 0) {
              t.sections.forEach(sec => {
                const sName = sec.name.toLowerCase();
                let sType = null;
                if (sName.includes('quant') || sName.includes('math')) sType = 'quant';
                else if (sName.includes('logical') || sName.includes('reasoning')) sType = 'logical';
                else if (sName.includes('verbal') || sName.includes('english')) sType = 'verbal';
                else if (sName.includes('data') || sName.includes('di')) sType = 'di';

                if (sType && currentUser.practiceScores[sType]) {
                  const sPct = sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
                  currentUser.practiceScores[sType].push(sPct);
                }
              });
            } else {
              const name = (t.testName || "").toLowerCase();
              let type = (name.includes('quant') ? 'quant' : (name.includes('logical') ? 'logical' : (name.includes('verbal') ? 'verbal' : 'di')));
              currentUser.practiceScores[type].push(t.percentage);
            }
          });

          // 🏗️ Performance Metrics are now handled directly by the UI using currentUser.practiceScores
        }

        // 🔄 TRIGGER FORCE-REFRESH: Ensure UI "lights up" with cloud data
        if (typeof buildDash === 'function') buildDash();
        if (typeof buildPractice === 'function') buildPractice();
        if (typeof buildTests === 'function') buildTests();
        console.log('[SYNC] Deep Hydration Complete for', roll);

        // 🚀 SESSION RESTORATION: Auto-Teleport to Last Active Page
        if (syncData.student && syncData.student.lastSession) {
          const lastPage = syncData.student.lastSession.lastActivePage || 'dash';
          const lastModule = syncData.student.lastSession.lastVisitedModule;

          if (lastPage !== 'dash' && typeof ss === 'function') {
            console.log('[RESTORATION] Redirecting user to:', lastPage);
            ss(lastPage);
          }

          // Seed local state from cloud
          localPersistentState.activeScreen = lastPage;
          localPersistentState.lastVisitedModule = lastModule;
          localPersistentState.progress = syncData.student.progress || localPersistentState.progress;
          localPersistentState.lastSyncAt = new Date();
        }
      }
    }
  } catch (syncErr) {
    if (syncOverlay) syncOverlay.remove();
    console.error('[SYNC] Background sync failed:', syncErr);
  }
}

/**
 * 🔄 SESSION RECOVERY: Called on page load
 */
async function initSessionRecovery() {
  try {
    console.log('[RECOVERY] Checking current session...');
    const result = await apiFetch('/auth/me');
    if (result.success && result.data) {
      const user = result.data;
      const roleMap = {
        'student': 'col-student',
        'faculty': 'faculty',
        'college_admin': 'col-admin',
        'collegeadmin': 'col-admin'
      };
      _enterInstitutionalUI(roleMap[user.role] || 'col-student', user);

      // Load user specifics
      const userDataRes = await apiFetch('/userdata');
      if (userDataRes.success && userDataRes.data) {
        localPersistentState.preferences = userDataRes.data.preferences || {};
        let savedPage = userDataRes.data.savedData?.lastAccessedPage || 'dash';
        
        // Role-based page validation
        const facultyScreens = ['fac-upload', 'fac-history', 'fac-tracker'];
        const adminScreens = ['cadm-dash', 'cadm-db', 'cadm-cycle', 'cadm-assess', 'cadm-jobs', 'cadm-scores', 'cadm-members', 'cadm-company', 'cadm-mockiv', 'cadm-learning', 'cadm-events', 'cadm-forms', 'cadm-community'];
        
        if (user.role === 'faculty' && !facultyScreens.includes(savedPage)) savedPage = 'fac-upload';
        if ((user.role === 'collegeadmin' || user.role === 'college_admin') && !adminScreens.includes(savedPage)) savedPage = 'cadm-dash';
        if (user.role === 'student' && (facultyScreens.includes(savedPage) || adminScreens.includes(savedPage))) savedPage = 'dash';

        localPersistentState.activeScreen = savedPage;
        
        // Pass correct navId to ss()
        let navId = 'nav-dash';
        if (savedPage === 'fac-upload') navId = 'nav-fac-upload';
        if (savedPage === 'fac-history') navId = 'nav-fac-history';
        if (savedPage === 'fac-tracker') navId = 'nav-fac-tracker';
        if (savedPage === 'cadm-dash') navId = 'nav-cadm-dash';
        
        // The screen switcher is already handled by _enterInstitutionalUI
        // But we sync the navId here just in case if it's different from the default
        if (localPersistentState.activeScreen !== 'fac-upload' && localPersistentState.activeScreen !== 'cadm-dash') {
           ss(localPersistentState.activeScreen, navId);
        }
      }

      startInstitutionalHeartbeat();
    }
  } catch (e) {
    console.log('[RECOVERY] No active session or invalid token found.');
    const loginPage = document.getElementById('institutional-login-page');
    const appContainer = document.getElementById('app');
    if (loginPage) loginPage.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
}

// Global invocation
window.addEventListener('load', initSessionRecovery);

async function doFacultyLogin() {
  const email = document.getElementById('inst-fac-email').value.trim().toLowerCase();
  const pass = document.getElementById('inst-fac-pass').value.trim();
  const collegeName = document.getElementById('sk-val-faculty').textContent;
  const collegeId = document.getElementById('sk-val-faculty')?.dataset.collegeId;
  const errEl = document.getElementById('inst-fac-err');

  if (collegeName.includes('Choose')) {
    if (errEl) { errEl.textContent = 'Select your college'; errEl.style.display = 'block'; }
    return;
  }
  if (!email.includes('@')) {
    if (errEl) { errEl.textContent = 'Invalid Email'; errEl.style.display = 'block'; }
    return;
  }

  showToast('Connecting...');

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, role: 'faculty', collegeId })
    });

    if (result.success) {
      _enterInstitutionalUI('faculty', result.data.user);
      startInstitutionalHeartbeat();
    }
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  }
}

async function doCollegeAdminLogin() {
  const email = document.getElementById('inst-adm-id').value.trim();
  const pass = document.getElementById('inst-adm-pass').value.trim();
  const collegeName = document.getElementById('sk-val-admin').textContent;
  const collegeId = document.getElementById('sk-val-admin')?.dataset.collegeId;
  const errEl = document.getElementById('inst-adm-err');

  if (collegeName.includes('Choose')) {
    if (errEl) { errEl.textContent = 'Select your college'; errEl.style.display = 'block'; }
    return;
  }
  if (!email.includes('@')) {
    if (errEl) { errEl.textContent = 'Invalid ID'; errEl.style.display = 'block'; }
    return;
  }

  showToast('Authenticating Admin...');

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass, role: 'college_admin', collegeId })
    });

    if (result.success) {
      _enterInstitutionalUI('col-admin', result.data.user);
      startInstitutionalHeartbeat();
    }
  } catch (e) {
    if (errEl) { errEl.textContent = e.message; errEl.style.display = 'block'; }
  }
}

// ss function removed to use the master implementation in core.js

function _enterInstitutionalUI(role, data) {
  activeRole = role;
  activeCollege = data.college || data.collegeId?.name || 'Selected Institution';
  activeUser = data;

  const brandEl = document.querySelector('.brand-logo');
  const toggleWrap = document.querySelector('.ui-toggle-wrap');

  if (typeof state !== 'undefined') {
    state.activeRole = role;
    state.userType = role;
  }
  if (role === 'col-admin' || role === 'collegeadmin' || role === 'college_admin' || role === 'admin') {
    window.activeCollegeAdmin = { college: activeCollege, adminId: data.email || 'Admin' };
  }
  
  if (typeof currentUser !== 'undefined') {
    const userName = data.name || data.studentId || 'Learner';
    currentUser.name = userName;
    currentUser.role = (role === 'col-student' ? 'student' : (role === 'faculty' ? 'faculty' : 'collegeadmin'));
    currentUser.college = activeCollege;
    currentUser.initials = userName.slice(0, 2).toUpperCase();

    // Sync to UI elements - Priority IDs
    const initialsEl = document.getElementById('sv3-avatar-initials');
    if (initialsEl) initialsEl.textContent = currentUser.initials;
    const nameEl = document.getElementById('sv3-display-name');
    if (nameEl) nameEl.textContent = userName;
    const roleEl = document.getElementById('sv3-display-role');
    if (roleEl) {
        roleEl.textContent = role === 'col-admin' ? 'Institutional Admin' : (role === 'faculty' ? 'Faculty Member' : 'Student');
    }

    if (!currentUser.practiceScores) currentUser.practiceScores = { logical: [], quant: [], verbal: [], di: [] };
    if (!currentUser.interviewScores) currentUser.interviewScores = [85, 92];
    if (!currentUser.recentActivity) currentUser.recentActivity = [];
    currentUser.testsCompleted = (data.stats && data.stats.testsCompleted) ? data.stats.testsCompleted : (currentUser.testsCompleted || 0);
    currentUser.avgAccuracy = (data.stats && data.stats.avgAccuracy) ? data.stats.avgAccuracy : (currentUser.avgAccuracy || 0);
    if (!currentUser.streak) currentUser.streak = 3;
    if (!currentUser.nationalRank) currentUser.nationalRank = 142;
    if (data._id) currentUser.id = data._id;
  }

  const loginPage = document.getElementById('institutional-login-page');
  const appContainer = document.getElementById('app');
  if (loginPage) loginPage.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';

  const navAd = document.getElementById('col-adminnav');
  const navFac = document.getElementById('col-facnav');
  const navStud = document.getElementById('col-studentnav');
  const navSuper = document.getElementById('super-adminnav');

  if (navAd) navAd.style.display = (role === 'col-admin' || role === 'collegeadmin' || role === 'college_admin' || role === 'admin' ? 'block' : 'none');
  if (navFac) navFac.style.display = (role === 'faculty' ? 'block' : 'none');
  if (navStud) navStud.style.display = (role === 'col-student' || role === 'student' ? 'block' : 'none');
  if (navSuper) navSuper.style.display = (role === 'super-admin' || role === 'super_admin' ? 'block' : 'none');

  if (brandEl) {
    brandEl.textContent = (role === 'col-student' ? 'SKILLOVATE' : 'College Admin');
  }
  if (toggleWrap) {
    toggleWrap.style.display = (role === 'col-student' ? 'none' : 'flex');
  }



  // 🏛️ Populate Institutional Badge in Top Bar
  const topColWrap = document.getElementById('top-college-wrap');
  const topColName = document.getElementById('top-college-name');
  if (topColWrap && topColName) {
    const college = data.collegeId?.name || data.college || (typeof activeCollege !== 'undefined' ? activeCollege : '');
    if (college && !college.includes('Institution') && !college.includes('Choose')) {
      topColName.textContent = college;
      topColWrap.style.display = 'flex';
    } else {
      topColWrap.style.display = 'none';
    }
  }

  if (role === 'col-admin' || role === 'collegeadmin' || role === 'college_admin' || role === 'admin') {
    if (typeof window.ss === 'function') window.ss('cadm-dash', 'nav-cadm-dash');
    if (typeof buildCadmDash === 'function') buildCadmDash();
    if (typeof buildCollegeDB === 'function') buildCollegeDB();
  } else if (role === 'super-admin' || role === 'super_admin') {
    if (typeof window.ss === 'function') window.ss('master-dash', 'nav-master-dash');
    renderInternalAdminDashboard('master-console-main-view');
  } else if (role === 'faculty') {
    if (typeof window.ss === 'function') window.ss('fac-upload', 'nav-fac-upload');
  } else {
    if (typeof window.ss === 'function') window.ss('dash', 'nav-dash');
  }

  showToast(`Welcome, ${data.name || 'Learner'}!`);
}

async function doLogout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.log('Server logout failed, clearing local session anyway');
  }
  // Session is cleared by removing cookies and refreshing memory
  location.reload();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function switchLoginTab(role) {
  document.querySelectorAll('#institutional-login-page .l-tab').forEach(btn => {
    btn.classList.remove('active');
    const btnRole = btn.id.replace('tab-btn-', '');
    if (btnRole === role) btn.classList.add('active');
  });
  document.querySelectorAll('#institutional-login-page .l-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('lp-' + role);
  if (target) target.classList.add('active');
}

async function doAdminLogin() {
  const pass = document.getElementById('plat-pass').value.trim();
  if (pass !== 'admin2026') {
    showToast('Invalid System Passphrase');
    return;
  }

  showToast('Connecting to Secure Vault...');

  // Bridge: Perform real backend login to get JWT token
  try {
    const authResult = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@skillovate.com',
        password: 'admin123',
        role: 'super_admin'
      })
    });

    if (!authResult.success) {
      throw new Error(authResult.message || 'Vault access unauthorized');
    }

    showToast('Vault Synchronized. Initializing Console...');
    const wrapper = document.getElementById('admin-modal-wrapper');
    const authCont = document.getElementById('admin-auth-container');
    const dashCont = document.getElementById('admin-dash-content');

    if (wrapper) {
      wrapper.style.maxWidth = '1000px';
      wrapper.style.padding = '0';
    }
    if (authCont) authCont.style.display = 'none';
    if (dashCont) {
      dashCont.style.display = 'block';
      setTimeout(() => dashCont.style.opacity = '1', 50);
      renderInternalAdminDashboard();
      // Option to enter full UI
      const btn = document.createElement('button');
      btn.className = 'btn btn-p';
      btn.style.position = 'absolute';
      btn.style.bottom = '20px';
      btn.style.right = '20px';
      btn.textContent = 'Enter Full Platform UI';
      btn.onclick = () => {
        closePlatformAdmin();
        _enterInstitutionalUI('super-admin', authResult.data.user);
      };
      dashCont.appendChild(btn);
    }
  } catch (e) {
    showToast('Master Auth Failed: ' + e.message);
    console.error('[MASTER AUTH]', e);
  }
}

function renderInternalAdminDashboard(targetId = 'admin-dash-content') {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; height: 90vh; max-height: 800px; background:var(--bg); border-radius:28px; overflow:hidden">
      <div style="padding: 24px 32px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: space-between; z-index:10">
        <div style="display:flex; align-items:center; gap:16px">
          <div style="width:48px; height:48px; background:var(--accent); border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 8px 16px rgba(27,111,230,0.3)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="24" height="24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <div>
            <h2 style="font-family:'Outfit', sans-serif; font-size:24px; font-weight:800; color:var(--text); letter-spacing:-0.5px">Master Console <span style="color:var(--accent)">Engine Control</span></h2>
            <div class="id-status online" style="margin-top:2px">
              <div class="id-pulse"></div>
              <span style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px">Proprietary AI v4.0 · System Operational</span>
            </div>
          </div>
        </div>
        <div class="id-tabs">
          <div class="id-tab active" id="id-tab-health" onclick="switchConsoleTab('health')">System Health</div>
          <div class="id-tab" id="id-tab-approvals" onclick="switchConsoleTab('approvals')">Access Approvals</div>
        </div>
        <div style="display:flex; gap:10px">
          <button class="btn btn-sm btn-o" onclick="showToast('Exporting system logs...')">Export Logs</button>
          <button class="btn btn-sm btn-p" onclick="syncMasterData()">Sync Global</button>
        </div>
      </div>
      <div id="console-view-container" style="flex:1; padding: 24px 32px; overflow:hidden; display:flex; flex-direction:column"></div>
    </div>
  `;
  switchConsoleTab('health');
}

function switchConsoleTab(tab) {
  document.querySelectorAll('.id-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('id-tab-' + tab).classList.add('active');
  if (tab === 'health') renderSystemHealth();
  else if (tab === 'approvals') renderApprovalsTab();
}

function renderSystemHealth() {
  const container = document.getElementById('console-view-container');
  container.innerHTML = `
    <div class="id-layout" style="flex:1; display:grid; grid-template-columns: 280px 1fr; gap:24px; overflow:hidden">
      <div style="overflow-y:auto">
        <div class="id-toggle-wrap" style="margin-bottom:24px">
          <div style="font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:12px">AI Generation Engine</div>
          <div class="id-toggle">
            <div class="id-toggle-btn active" id="btn-engine-sk" onclick="switchEngine('sk')">SW AI</div>
            <div class="id-toggle-btn" id="btn-engine-skilly" onclick="switchEngine('skilly')">Skilly AI (Local)</div>
          </div>
        </div>
        <div style="display:grid; gap:12px">
          <div class="id-card" style="padding:16px">
            <div style="font-size:11px; font-weight:700; color:var(--muted)">MODEL ACCURACY</div>
            <div style="font-size:28px; font-weight:800; color:var(--green); margin:8px 0" id="dash-acc-val">94.8%</div>
            <div style="height:4px; background:var(--surface2); border-radius:2px; overflow:hidden">
              <div style="height:100%; width:94.8%; background:var(--green)"></div>
            </div>
          </div>
          <div class="id-card" style="padding:16px">
            <div style="font-size:11px; font-weight:700; color:var(--muted)">INFERENCE LATENCY</div>
            <div style="font-size:28px; font-weight:800; color:var(--accent); margin:8px 0" id="dash-lat-val">12ms</div>
          </div>
        </div>
      </div>
      <div style="display:grid; grid-template-rows: 1fr 200px; gap:24px; overflow:hidden">
        <div class="id-card" style="display:flex; flex-direction:column; padding:20px">
          <div style="font-size:14px; font-weight:700; color:var(--text); margin-bottom:16px">Subject-wise Performance Baseline</div>
          <div style="flex:1; position:relative"><canvas id="id-accuracy-chart"></canvas></div>
        </div>
        <div class="id-card" style="display:flex; flex-direction:column; overflow:hidden; padding:0">
          <div style="font-size:13px; font-weight:800; color:var(--text); padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between">
            Live System Events
            <span style="font-size:10px; color:var(--accent); background:var(--accent-l); padding:2px 8px; border-radius:20px; font-weight:700">Real-time Stream</span>
          </div>
          <div class="id-log" id="id-live-log" style="flex:1; overflow-y:auto; padding:0"></div>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => {
    if (typeof buildAdminCharts !== 'undefined') buildAdminCharts('id-accuracy-chart');
    _startLiveEvents();
  }, 100);
}

async function renderApprovalsTab() {
  const container = document.getElementById('console-view-container');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">Loading pending approvals...</div>';

  try {
    const result = await apiFetch('/batches/pending');
    const batches = result.data || [];

    if (batches.length === 0) {
      container.innerHTML = '<div class="appr-empty">No pending submissions</div>';
      return;
    }

    const listHtml = batches.map(b => `
      <div class="appr-row" id="appr-batch-${b._id}">
        <div class="appr-avatar fac">${b.facultyName?.slice(0, 2).toUpperCase() || 'FA'}</div>
        <div class="appr-info">
          <div class="appr-name">${b.name}</div>
          <div class="appr-meta">${b.college} | ${b.students.length} Students | ${b.department} ${b.year}</div>
        </div>
        <div class="appr-actions">
          <button class="appr-btn-v3 reject" onclick="window.setMasterApprovalStatus('batch', '${b._id || b.id}', 'rejected')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Deny
          </button>
          <button class="appr-btn-v3 approve" onclick="window.setMasterApprovalStatus('batch', '${b._id || b.id}', 'approved')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Approve
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `<div class="appr-container">${listHtml}</div>`;
  } catch (e) {
    container.innerHTML = '<div class="appr-empty">Error loading batches: ' + e.message + '</div>';
  }
}

function syncMasterData() {
  showToast('Synchronizing global database...');
  setTimeout(() => showToast('Masters database up-to-date'), 800);
}

function switchEngine(type) {
  document.querySelectorAll('.id-toggle-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('btn-engine-' + type).classList.add('active');
  showToast('Switched to ' + (type === 'skilly' ? 'Skilly AI' : 'SW AI') + ' engine');
}

async function setMasterApprovalStatus(type, id, status) {
  console.log(`[MASTER APPROVE] Optimistic Executing ${status} for ${id}`);

  if (!id || id === 'undefined') {
    showToast('Invalid Batch ID. Please refresh page.');
    return;
  }

  // 🚀 OPTIMISTIC UI: Target the row and hide it immediately
  const rowEl = document.getElementById(`appr-batch-${id}`);
  if (rowEl) {
    rowEl.classList.add('fade-shrink');
    // We add a class that triggers the CSS fade-out/height-collapse
  }

  if (type === 'batch') {
    try {
      // Show loading on the button (if still visible during animation)
      const btn = rowEl?.querySelector(`.appr-btn-v3.${status === 'approved' ? 'approve' : 'reject'}`);
      if (btn) btn.classList.add('is-processing');

      const result = await apiFetch(`/batches/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (result.success) {
        showToast(`Batch ${status} successfully`);
        // The row is already gone, but we refresh list in background to sync state
        setTimeout(renderApprovalsTab, 500);
      } else {
        throw new Error(result.message || 'Server rejected request');
      }
    } catch (e) {
      console.error('[MASTER APPROVE] Failed:', e);
      showToast('Action failed: ' + e.message);

      // 🔄 ROLLBACK: Restore the row if the request failed
      if (rowEl) {
        rowEl.classList.remove('fade-shrink');
        const btn = rowEl.querySelector('.is-processing');
        if (btn) btn.classList.remove('is-processing');
      }
    }
  }
}
// Force Global Scope
window.setMasterApprovalStatus = setMasterApprovalStatus;

function _startLiveEvents() {
  const log = document.getElementById('id-live-log');
  if (!log) return;
  const events = [{ type: 'gen', msg: 'Generated 15 Quant questions' }, { type: 'sync', msg: 'Batch synchronized' }];
  const addEvent = () => {
    const ev = events[Math.floor(Math.random() * events.length)];
    log.insertAdjacentHTML('afterbegin', `<div class="id-log-item">${ev.msg}</div>`);
    if (log.children.length > 10) log.lastElementChild.remove();
  };
  setInterval(addEvent, 5000);
  addEvent();
}

// doGoogleLogin removed as official button is now rendered via initGoogleAuth


function initPlatformData() {
  window.facultyBatches = [];
}

async function initAllSkDropdowns() {
  try {
    const res = await apiFetch('/colleges');
    if (res.success && res.data) {
      const colleges = res.data;
      ['learner', 'faculty', 'admin', 'fac-reg', 'adm-reg'].forEach(role => {
        const menu = document.getElementById(`sk-menu-${role}`);
        if (!menu) return;
        menu.innerHTML = colleges.map(c => `
          <div class="sk-dropdown-item" onclick="selectSkOption('${role}', '${c.name}', '${c._id}')">${c.name}</div>
        `).join('');
      });
    }
  } catch (e) {
    console.error('[IDENTITY] Failed to fetch college list:', e);
  }
}

function toggleSkDropdown(role) {
  const dd = document.getElementById(`dropdown-${role}`);
  if (!dd) return;
  const wasOpen = dd.classList.contains('open');
  // Close all other dropdowns first
  document.querySelectorAll('.sk-dropdown').forEach(d => d.classList.remove('open'));
  if (!wasOpen) dd.classList.add('open');
  // Prevent immediate window click from closing it
  if (window.event) window.event.stopPropagation();
}

// 🖱️ CLICK-AWAY: Close all dropdowns when clicking outside
window.addEventListener('click', (e) => {
  if (!e.target.closest('.sk-dropdown')) {
    document.querySelectorAll('.sk-dropdown').forEach(d => d.classList.remove('open'));
  }
});

function selectSkOption(role, name, id) {
  const displayEl = document.getElementById(`sk-val-${role}`);
  const hiddenInput = document.getElementById(`inst-${role}-college`);
  if (displayEl) {
    displayEl.textContent = name;
    displayEl.dataset.collegeId = id; // Store ID for logic
  }
  if (hiddenInput) hiddenInput.value = name;

  // Update visual selection state
  const menu = document.getElementById(`sk-menu-${role}`);
  if (menu) {
    menu.querySelectorAll('.sk-dropdown-item').forEach(item => {
      item.classList.toggle('selected', item.textContent.trim() === name);
    });
  }

  const dd = document.getElementById(`dropdown-${role}`);
  if (dd) dd.classList.remove('open');
}


function loadCollegeAdminDashboard() {
  const nameEl = document.getElementById('cadm-college-name');
  if (nameEl) nameEl.textContent = activeCollege || 'Selected Institution';

  // Elements are now updated dynamically by buildCadmDash() via startDashboardSync()
}

function _attachErrorClearing() {
  const inputs = document.querySelectorAll('.institutional-login-card input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      const card = input.closest('.institutional-login-card');
      const err = card?.querySelector('.auth-warn');
      if (err) {
        err.textContent = '';
        err.style.display = 'none';
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initAllSkDropdowns();
  initPlatformData();
  initSessionRecovery(); // 🔄 AUTO-SYNC TRIGGER
  _attachErrorClearing();

  // 🔄 LIVE SYNC HEARTBEAT (30s)
  setInterval(() => {
    if (!currentUser) return;
    const curScreen = localPersistentState.activeScreen;
    if (curScreen === 'fac-tracker' && typeof loadFacultyTracker === 'function') loadFacultyTracker();
    if (curScreen === 'cadm-dash' && typeof buildCadmDash === 'function') buildCadmDash();
    if (curScreen === 'cadm-db' && typeof buildCollegeDB === 'function') buildCollegeDB();
  }, 30000);
});



async function buildCollegeDB() {
  if (typeof showToast === 'function') showToast('📡 Syncing Database...');
  const dbg = document.getElementById('cadm-debug-status'); if (dbg) dbg.textContent = '[SYNC] FETCHING STUDENTS...';

  const collegeName = typeof activeCollege !== 'undefined' ? activeCollege : 'Your Institution';
  const titleEl = document.getElementById('cadm-db-title');
  const subEl = document.getElementById('cadm-db-sub');

  if (titleEl) titleEl.textContent = collegeName + ' — Student Database';
  if (subEl) subEl.textContent = '🔄 Synchronizing live records...';

  try {
    console.log('[SYNC] Fetching from /api/students...');
    const result = await apiFetch('/students?limit=1000');
    console.log('[SYNC] Received result:', result.success, 'count:', result.data?.length);
    const debugEl = document.getElementById('cadm-debug-status');
    if (debugEl) {
      debugEl.textContent = `[DEBUG] Success: ${result.success} | Count: ${result.data?.length || 0} | Msg: ${result.message || 'OK'}`;
      debugEl.style.color = result.success ? 'var(--green)' : 'var(--red)';
    }


    if (result.success) {
      // Map backend fields to frontend expected fields
      cadmAllStudents = result.data.map(s => ({
        name: s.name,
        roll: s.studentId,
        year: s.year || 'N/A',
        batch: s.department || 'General',
        faculty: s.facultyId?.name || 'Auto-Synced',
        status: s.status || 'approved', // Use real status
        l: s.stats?.logical || 0,
        q: s.stats?.quant || 0,
        v: s.stats?.verbal || 0,
        d: s.stats?.di || 0,
        totalTests: s.stats?.testsCompleted || 0,
        bestAttemptNo: s.stats?.bestAttemptNo || 1,
        acc: s.stats?.avgAccuracy || 0
      }));

      if (subEl) {
        const now = new Date().toLocaleTimeString();
        subEl.textContent = `${cadmAllStudents.length} registered students · Last synced: ${now}`;
      }

      // Build dept chips
      const uniqueDepts = [...new Set(cadmAllStudents.map(s => s.batch))];
      const chipsEl = document.getElementById('cadm-dept-chips');
      if (chipsEl) {
        chipsEl.innerHTML = uniqueDepts.map(dept => {
          const count = cadmAllStudents.filter(s => s.batch === dept).length;
          return `<span class="col-sel-chip" id="dept-chip-${dept}" onclick="filterByDept('${dept}',this)">${dept} <span style="opacity:.7;font-size:10px">(${count})</span></span>`;
        }).join('');
      }

      if (typeof cadmActiveDept === 'undefined') window.cadmActiveDept = 'all';
      applyFilters();
    }
  } catch (err) {
    console.error('[SYNC ERROR] Student DB:', err);
    if (subEl) subEl.textContent = 'Sync connection interrupted. Retrying...';
  }
}

let cadmAllStudents = [];
let cadmActiveDept = 'all';
let activeCollegeAdmin = null;

function applyFilters() {
  if (typeof activeUser === 'undefined' && !window.activeCollegeAdmin) return;
  const { filtered, deptLabel } = getFilteredStudents();
  const tagEl = document.getElementById('active-filter-tag');
  const countEl = document.getElementById('cadm-filtered-count');
  if (tagEl) tagEl.innerHTML = cadmActiveDept !== 'all'
    ? `<span style="background:var(--accent-l);color:var(--accent);border:1px solid rgba(27,111,230,.2);border-radius:12px;padding:3px 10px;font-size:11px;font-weight:700">Dept: ${cadmActiveDept}</span>` : '';
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${cadmAllStudents.length} students`;

  const approved = filtered.filter(s => s.status === 'approved');
  const avgAcc = approved.length ? Math.round(approved.reduce((a, s) => a + (s.acc || 0), 0) / approved.length) : 0;

  document.getElementById('cadm-db-stats').innerHTML = `
    <div class="sc"><div class="si2" style="background:var(--accent-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="15" height="15"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="sv">${filtered.length}</div><div class="sl">Shown</div></div>
    <div class="sc"><div class="si2" style="background:var(--green-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" width="15" height="15"><polyline points="20,6 9,17 4,12"/></svg></div><div class="sv" style="color:var(--green)">${approved.length}</div><div class="sl">Approved</div></div>
    <div class="sc"><div class="si2" style="background:var(--teal-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" width="15" height="15"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg></div><div class="sv" style="color:var(--teal)">${avgAcc}%</div><div class="sl">Avg Accuracy</div></div>`;

  document.getElementById('cadm-db-tbody').innerHTML = filtered.map((s, i) => {
    const acc = s.acc || 0;
    const tests = s.totalTests || 0;
    const lastActive = 'Active Now';
    const ini = getInitials(s.name);

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px">
            <div class="sk-table-avatar" style="background:var(--accent-l); color:var(--accent)">${ini}</div>
            <div style="font-weight:700">${s.name}</div>
          </div>
        </td>
        <td style="font-family:monospace">${s.roll}</td>
        <td style="font-size:12px">${s.batch} / ${s.year} Year</td>
        <td><span class="badge bp">${tests} Tests</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
             <div class="pw" style="width:60px; height:6px"><div class="pf" style="width:${acc}%"></div></div>
             <span style="font-weight:600; font-size:12px">${acc}%</span>
          </div>
        </td>
        <td style="font-size:12px; color:var(--muted)">${lastActive}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">No students match the current filters</td></tr>';
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

// ════════ WORD DOWNLOAD ════════
function downloadWord(mode) {
  if (!activeCollegeAdmin) { showToast('Please log in as College Admin'); return; }
  const { college } = activeCollegeAdmin;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const wordHeader = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='UTF-8'><meta name=ProgId content=Word.Document><style>body{font-family:Arial,sans-serif;font-size:11pt;color:#1E2350;margin:1in}h1{font-size:18pt;font-weight:bold;color:#0D2461;margin-bottom:4pt}h2{font-size:13pt;font-weight:bold;color:#1B6FE6;margin:14pt 0 6pt}.meta{font-size:10pt;color:#6B7280;margin-bottom:14pt}table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-bottom:16pt}th{background:#1B6FE6;color:white;padding:7px 8px;border:1px solid #1B6FE6;font-weight:700;text-align:center}tr:nth-child(even){background:#F5F7FF}.footer{margin-top:18pt;font-size:9pt;color:#94A3B8;border-top:1px solid #E2E8F0;padding-top:8pt}</style></head><body>`;
  const wordFooter = `<div class="footer">SkilloWait — AI Aptitude Training Platform &nbsp;·&nbsp; Confidential · For institutional use only.</div></body></html>`;
  const tc = s => { const t = s.l + s.q + s.v + s.d; return t >= 72 ? '#0E9F6E' : t >= 45 ? '#1B6FE6' : '#EF4444'; };
  const gc = { O: '#6C5CE7', A: '#0E9F6E', B: '#1B6FE6', C: '#F59E0B', D: '#EF4444' };
  const cell = (v, extra = '') => `<td style="padding:6px 8px;border:1px solid #D0D5E8;${extra}">${v}</td>`;
  const cCenter = (v, extra = '') => cell(v, 'text-align:center;' + extra);

  if (mode === 'db') {
    // ✅ Matches exactly what's on screen
    const { filtered } = getFilteredStudents();
    const summary = getFilterSummary();
    const deptSlug = summary.dept === 'All Departments' ? 'All' : summary.dept;
    const rows = filtered.map((s, i) => {
      const total = s.l + s.q + s.v + s.d; const grade = s.status === 'approved' ? getGrade(total) : null;
      const sc = s.status === 'approved' ? '#0E9F6E' : s.status === 'denied' ? '#EF4444' : '#F59E0B';
      return `<tr>${cCenter(i + 1)}${cell(s.name, 'font-weight:600')}${cell(s.roll, 'font-family:Courier New;font-weight:600;color:#1B6FE6')}${cCenter(s.year)}${cell(s.batch)}${cell(s.faculty, 'font-size:10pt;color:#6B7280')}${cCenter(s.status.charAt(0).toUpperCase() + s.status.slice(1), 'font-weight:700;color:' + sc)}${cCenter(s.status === 'approved' ? (s.totalTests || 0) : '—', 'color:#6B7280')}${cCenter(s.status === 'approved' ? s.l : '—', 'color:#1B6FE6;font-weight:700')}${cCenter(s.status === 'approved' ? s.q : '—', 'color:#0D9488;font-weight:700')}${cCenter(s.status === 'approved' ? s.v : '—', 'color:#6C5CE7;font-weight:700')}${cCenter(s.status === 'approved' ? s.d : '—', 'color:#F59E0B;font-weight:700')}${cCenter(s.status === 'approved' ? total : '—', 'font-size:13pt;font-weight:800;color:' + tc(s))}${cCenter(grade ? grade.g : '—', 'font-weight:800;color:' + (grade ? gc[grade.g] : '#CBD5E1'))}</tr>`;
    }).join('');
    const html = wordHeader +
      `<h1>${college}</h1>
       <div class="meta">
         Dept: <strong>${summary.dept}</strong> &nbsp;·&nbsp;
         Status: <strong>${summary.status}</strong> &nbsp;·&nbsp;
         ${today} &nbsp;·&nbsp; ${filtered.length} students shown
       </div>
       <table><thead><tr>
         <th style="width:4%">S.No</th><th style="width:13%">Name</th><th style="width:9%">Roll No.</th>
         <th style="width:7%">Year</th><th style="width:10%">Batch</th><th style="width:11%">Faculty</th>
         <th style="width:7%">Status</th><th style="width:5%">Tests</th>
         <th style="width:6%">Logical<br>/30</th><th style="width:6%">Quant<br>/30</th>
         <th style="width:6%">Verbal<br>/15</th><th style="width:6%">DI<br>/15</th>
         <th style="width:7%">Total<br>/90</th><th style="width:6%">Grade</th>
       </tr></thead><tbody>${rows}</tbody></table>`
      + wordFooter;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'application/msword' }));
    a.download = college.replace(/\s+/g, '_') + '_' + deptSlug.replace(/\s+/g, '_') + '_DB.doc';
    a.click();
    showToast('Word downloaded — ' + filtered.length + ' students (' + summary.dept + ')!');

  } else {
    const students = generateCollegeStudents(college).filter(s => s.status === 'approved');
    const avg = k => students.length ? +(students.reduce((a, s) => a + s[k], 0) / students.length).toFixed(1) : 0;
    const aL = avg('l'), aQ = avg('q'), aV = avg('v'), aD = avg('d'), aT = +(aL + aQ + aV + aD).toFixed(1);
    const grades = { O: 0, A: 0, B: 0, C: 0, D: 0 };
    students.forEach(s => { grades[getGrade(s.l + s.q + s.v + s.d).g]++; });
    const subRows = [['Logical Reasoning', aL, 30, '#1B6FE6'], ['Quantitative Aptitude', aQ, 30, '#0D9488'], ['Verbal / English', aV, 15, '#6C5CE7'], ['Data Interpretation', aD, 15, '#F59E0B']].map(([sub, val, max, col], i) =>
      `<tr ${i % 2 ? 'style="background:#F5F7FF"' : ''}>${cell(sub, 'font-weight:600;color:' + col)}${cCenter(val, 'font-weight:700;color:' + col)}${cCenter(max)}${cCenter(Math.round(val / max * 100) + '%')}</tr>`).join('')
      + `<tr style="background:#EBF3FF">${cell('OVERALL AVERAGE', 'font-weight:800;color:#0D2461')}${cCenter(aT, 'font-size:13pt;font-weight:800;color:#0E9F6E')}${cCenter(90, 'font-weight:700')}${cCenter(Math.round(aT / 90 * 100) + '%', 'font-weight:700')}</tr>`;
    const gradeRows = [['O', 'Outstanding', '81–90', '#6C5CE7'], ['A', 'Excellent', '72–80', '#0E9F6E'], ['B', 'Good', '63–71', '#1B6FE6'], ['C', 'Average', '45–62', '#F59E0B'], ['D', 'Needs Improvement', '<45', '#EF4444']].map(([g, lbl, rng, col], i) =>
      `<tr ${i % 2 ? 'style="background:#F5F7FF"' : ''}>${cCenter(g, 'font-weight:800;color:' + col)}${cell(lbl, 'font-weight:600')}${cCenter(rng + '/90', 'color:#6B7280')}${cCenter(grades[g], 'font-weight:700')}${cCenter(students.length ? Math.round(grades[g] / students.length * 100) : 0 + '%')}</tr>`).join('');
    const topRows = [...students].sort((a, b) => (b.l + b.q + b.v + b.d) - (a.l + a.q + a.v + a.d)).map((s, i) => {
      const total = s.l + s.q + s.v + s.d; const pct = Math.round(total / 90 * 100); const grade = getGrade(total);
      return `<tr>${cCenter('#' + (i + 1), 'font-weight:700')}${cell(s.name, 'font-weight:600')}${cell(s.roll, 'font-family:Courier New;color:#1B6FE6')}${cell(s.batch)}${cCenter(s.l, 'font-weight:700;color:#1B6FE6')}${cCenter(s.q, 'font-weight:700;color:#0D9488')}${cCenter(s.v, 'font-weight:700;color:#6C5CE7')}${cCenter(s.d, 'font-weight:700;color:#F59E0B')}${cCenter(total, 'font-size:13pt;font-weight:800;color:' + tc(s))}${cCenter(pct + '%')}${cCenter(grade.g, 'font-weight:800;color:' + gc[grade.g])}</tr>`;
    }).join('');
    const html = wordHeader + `<h1>${college} — Score Report</h1><div class="meta">${today} &nbsp;·&nbsp; ${students.length} evaluated students &nbsp;·&nbsp; All marks out of 90</div><h2>Subject-wise Average Scores</h2><table style="width:60%"><thead><tr><th>Subject</th><th>Average</th><th>Max</th><th>Avg %</th></tr></thead><tbody>${subRows}</tbody></table><h2>Grade Distribution</h2><table style="width:55%"><thead><tr><th>Grade</th><th>Level</th><th>Marks</th><th>Count</th><th>%</th></tr></thead><tbody>${gradeRows}</tbody></table><h2>Student Rankings (All scores out of 90)</h2><table><thead><tr><th>Rank</th><th>Name</th><th>Roll No.</th><th>Batch</th><th>Logical<br>/30</th><th>Quant<br>/30</th><th>Verbal<br>/15</th><th>DI<br>/15</th><th>Total<br>/90</th><th>%</th><th>Grade</th></tr></thead><tbody>${topRows}</tbody></table>` + wordFooter;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'application/msword' }));
    a.download = college.replace(/\s+/g, '_') + '_ScoreReport.doc'; a.click();
    showToast('Word score report downloaded!');
  }
}

function buildCollegeScores() {
  if (!activeCollegeAdmin) return;
  const { college } = activeCollegeAdmin;
  const students = generateCollegeStudents(college).filter(s => s.status === 'approved');
  const avg = key => students.length ? +(students.reduce((a, s) => a + s[key], 0) / students.length).toFixed(1) : 0;
  const aL = avg('l'), aQ = avg('q'), aV = avg('v'), aD = avg('d');
  const grades = { O: 0, A: 0, B: 0, C: 0, D: 0 };
  students.forEach(s => { grades[getGrade(s.l + s.q + s.v + s.d).g]++; });
  document.getElementById('cadm-scores-body').innerHTML = `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px">
    <div class="card">
      <div class="ct">Subject-wise Average Scores</div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-top:4px">
        ${[['Logical Reasoning', aL, 30, 'var(--accent)'], ['Quantitative Aptitude', aQ, 30, 'var(--teal)'], ['Verbal / English', aV, 15, 'var(--purple)'], ['Data Interpretation', aD, 15, 'var(--amber)']].map(([sub, val, max, col]) => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px">
              <span style="font-weight:600;color:var(--text)">${sub}</span>
              <span style="font-weight:700;color:${col}">${val}<span style="color:var(--muted);font-weight:400"> / ${max}</span></span>
            </div>
            <div class="score-bar-wrap" style="height:8px"><div class="score-bar-fill" style="width:${Math.round(val / max * 100)}%;background:${col}"></div></div>
          </div>`).join('')}
        <div style="padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:700;color:var(--text)">Overall Average</span>
          <span style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--green)">${+(aL + aQ + aV + aD).toFixed(1)}<span style="font-size:12px;font-weight:400;color:var(--muted)"> / 90</span></span>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="ct">Grade Distribution · ${students.length} evaluated students</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">
        ${[['O', 'Outstanding', '≥81/90', 'var(--purple)'], ['A', 'Excellent', '≥72/90', 'var(--green)'], ['B', 'Good', '≥63/90', 'var(--accent)'], ['C', 'Average', '≥45/90', 'var(--amber)'], ['D', 'Needs Improvement', '<45/90', 'var(--red)']].map(([g, label, range, col]) => `
          <div style="display:flex;align-items:center;gap:10px">
            <div class="grade-badge grade-${g}" style="flex-shrink:0">${g}</div>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600;color:var(--text)">${label} <span style="color:var(--muted);font-weight:400">(${range})</span></div>
              <div class="score-bar-wrap" style="height:6px;margin-top:4px"><div class="score-bar-fill" style="width:${students.length ? Math.round(grades[g] / students.length * 100) : 0}%;background:${col}"></div></div>
            </div>
            <span style="font-size:14px;font-weight:700;color:${col};min-width:24px;text-align:right">${grades[g]}</span>
          </div>`).join('')}
      </div>
    </div>
  </div>
  <div class="card">
    <div class="ct">Top Students by Total Score · All marks out of 90</div>
    <table><thead><tr><th>Rank</th><th>Name</th><th>Roll No.</th><th>Batch</th><th style="text-align:center">Logical<br><span style="font-weight:400;font-size:9px">/30</span></th><th style="text-align:center">Quant<br><span style="font-weight:400;font-size:9px">/30</span></th><th style="text-align:center">Verbal<br><span style="font-weight:400;font-size:9px">/15</span></th><th style="text-align:center">DI<br><span style="font-weight:400;font-size:9px">/15</span></th><th style="text-align:center">Total<br><span style="font-weight:400;font-size:9px">/90</span></th><th style="text-align:center">%</th><th style="text-align:center">Grade</th></tr></thead>
    <tbody>${[...students].sort((a, b) => (b.l + b.q + b.v + b.d) - (a.l + a.q + a.v + a.d)).map((s, i) => {
    const total = s.l + s.q + s.v + s.d; const pct = Math.round(total / 90 * 100); const grade = getGrade(total);
    const rk = i === 0 ? 'color:#F59E0B;font-weight:800' : i === 1 ? 'color:#94A3B8;font-weight:700' : i === 2 ? 'color:#CD7F32;font-weight:700' : 'color:var(--muted)';
    return `<tr>
        <td><span style="${rk}">#${i + 1}</span></td>
        <td><div class="tn">${s.name}</div></td>
        <td><span style="font-family:monospace;font-size:12px;color:var(--accent)">${s.roll}</span></td>
        <td><span style="font-size:12px;color:var(--muted)">${s.batch}</span></td>
        <td style="text-align:center;font-weight:700;color:var(--accent)">${s.l}</td>
        <td style="text-align:center;font-weight:700;color:var(--teal)">${s.q}</td>
        <td style="text-align:center;font-weight:700;color:var(--purple)">${s.v}</td>
        <td style="text-align:center;font-weight:700;color:var(--amber)">${s.d}</td>
        <td style="text-align:center"><span style="font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:${total >= 72 ? 'var(--green)' : total >= 45 ? 'var(--accent)' : 'var(--red)'}">${total}</span></td>
        <td style="text-align:center;font-size:12px;font-weight:700;color:var(--muted)">${pct}%</td>
        <td style="text-align:center"><div class="grade-badge grade-${grade.g}" title="${grade.label}">${grade.g}</div></td>
      </tr>`;
  }).join('')}
    </tbody></table>
  </div>`;
}

// ════════ EXCEL / CSV DOWNLOAD ════════
function downloadExcel(mode) {
  if (!activeCollegeAdmin) { showToast('Please log in as College Admin'); return; }
  const { college } = activeCollegeAdmin;
  let rows, sheetName, filename;
  if (mode === 'db') {
    // ✅ Always matches what's visible on screen
    const { filtered, deptLabel } = getFilteredStudents();
    const summary = getFilterSummary();
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    // Meta info rows at top
    rows = [
      ['SkilloWait Student Database Export'],
      ['College:', college],
      ['Department Filter:', summary.dept],
      ['Status Filter:', summary.status],
      ['Generated:', today],
      ['Total Rows:', filtered.length],
      ['Scoring Rule:', 'Best combined test across all attempts (Logical+Quant+Verbal+DI / 90)'],
      [],
      ['S.No', 'Student Name', 'Roll Number', 'Year of Study', 'Batch', 'Faculty', 'Access Status', 'Tests Taken', 'Best Attempt No.', 'Logical (/30)', 'Quantitative (/30)', 'Verbal (/15)', 'Data Interpretation (/15)', 'Total Score (/90)', 'Percentage (%)', 'Grade', 'Performance Level']
    ];
    filtered.forEach((s, i) => {
      const total = s.l + s.q + s.v + s.d;
      const grade = s.status === 'approved' ? getGrade(total) : null;
      rows.push([
        i + 1, s.name, s.roll, s.year, s.batch, s.faculty,
        s.status.charAt(0).toUpperCase() + s.status.slice(1),
        s.status === 'approved' ? (s.totalTests || 0) : 'N/A',
        s.status === 'approved' ? (s.bestAttemptNo || 1) : 'N/A',
        s.status === 'approved' ? s.l : 'N/A', s.status === 'approved' ? s.q : 'N/A',
        s.status === 'approved' ? s.v : 'N/A', s.status === 'approved' ? s.d : 'N/A',
        s.status === 'approved' ? total : 'N/A',
        s.status === 'approved' ? Math.round(total / 90 * 100) + '%' : 'N/A',
        grade ? grade.g : 'N/A', grade ? grade.label : 'Access not granted'
      ]);
    });
    // Summary row
    const approvedRows = filtered.filter(s => s.status === 'approved');
    if (approvedRows.length) {
      const aL = +(approvedRows.reduce((a, s) => a + s.l, 0) / approvedRows.length).toFixed(1);
      const aQ = +(approvedRows.reduce((a, s) => a + s.q, 0) / approvedRows.length).toFixed(1);
      const aV = +(approvedRows.reduce((a, s) => a + s.v, 0) / approvedRows.length).toFixed(1);
      const aD = +(approvedRows.reduce((a, s) => a + s.d, 0) / approvedRows.length).toFixed(1);
      const aT = +(aL + aQ + aV + aD).toFixed(1);
      rows.push([]);
      rows.push(['', 'FILTERED AVERAGE', '', '', '', '', 'Approved: ' + approvedRows.length, '', '', aL, aQ, aV, aD, aT, Math.round(aT / 90 * 100) + '%', '', '']);
    }
    const deptSlug = summary.dept === 'All Departments' ? 'All' : summary.dept;
    sheetName = (college.slice(0, 20) + ' ' + deptSlug).slice(0, 31);
    filename = college.replace(/\s+/g, '_') + '_' + deptSlug.replace(/\s+/g, '_') + '_DB';
  } else {
    const students = generateCollegeStudents(college);
    const approved = students.filter(s => s.status === 'approved');
    rows = [['S.No', 'Student Name', 'Roll Number', 'Year', 'Batch', 'Faculty', 'Tests Taken', 'Best Attempt', 'Logical (/30)', 'Quantitative (/30)', 'Verbal (/15)', 'DI (/15)', 'Total (/90)', 'Percentage (%)', 'Grade', 'Performance Level']];
    [...approved].sort((a, b) => (b.l + b.q + b.v + b.d) - (a.l + a.q + a.v + a.d)).forEach((s, i) => {
      const total = s.l + s.q + s.v + s.d; const grade = getGrade(total);
      rows.push([i + 1, s.name, s.roll, s.year, s.batch, s.faculty,
      s.totalTests || 0, s.bestAttemptNo || 1,
      s.l, s.q, s.v, s.d, total, Math.round(total / 90 * 100) + '%', grade.g, grade.label]);
    });
    if (approved.length) {
      const aL = +(approved.reduce((a, s) => a + s.l, 0) / approved.length).toFixed(1);
      const aQ = +(approved.reduce((a, s) => a + s.q, 0) / approved.length).toFixed(1);
      const aV = +(approved.reduce((a, s) => a + s.v, 0) / approved.length).toFixed(1);
      const aD = +(approved.reduce((a, s) => a + s.d, 0) / approved.length).toFixed(1);
      const aT = +(aL + aQ + aV + aD).toFixed(1);
      const avgTests = +(approved.reduce((a, s) => a + (s.totalTests || 0), 0) / approved.length).toFixed(1);
      rows.push([]);
      rows.push(['—', 'COLLEGE AVERAGE', '', '', '', '', avgTests + ' avg tests', '—', aL, aQ, aV, aD, aT, Math.round(aT / 90 * 100) + '%', '—', 'Batch Average']);
      rows.push([]);
      rows.push(['NOTE', 'Scores = Best combined test (Logical+Quant+Verbal+DI) across ALL attempts on SkilloWait']);
    }
    sheetName = college.slice(0, 25) + ' Scores';
    filename = college.replace(/\s+/g, '_') + '_ScoreReport';
  }
  try {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = rows[0].map((_, i) => ({ wch: i === 1 || i === 5 ? 22 : i === 0 ? 5 : 14 }));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename + '_SkilloWait.xlsx');
    showToast('Excel downloaded — ' + filename + '_SkilloWait.xlsx');
  } catch (e) {
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename + '_SkilloWait.csv'; a.click();
    showToast('Downloaded as CSV (Excel fallback)');
  }
}

// ════════ HR ANALYTICS ════════
function buildHRAnalytics() {
  const names = Object.keys(studentProfiles);
  const profiles = names.map(n => ({ name: n, ...studentProfiles[n], readiness: computeReadiness(studentProfiles[n]) }));

  const el = document.getElementById('hr-analytics-body');
  if (!el) return;

  // Summary stats
  const avgReady = Math.round(profiles.reduce((a, p) => a + p.readiness.score, 0) / profiles.length);
  const highlyReady = profiles.filter(p => p.readiness.score >= 85).length;
  const improving = profiles.filter(p => p.trendDir === 'up').length;

  el.innerHTML = `
  <!-- Summary KPIs -->
  <div class="sg" style="margin-bottom:20px">
    <div class="sc"><div class="si2" style="background:var(--green-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" width="15" height="15"><polyline points="20,6 9,17 4,12"/></svg></div><div class="sv" style="color:var(--green)">${highlyReady}</div><div class="sl">Highly Ready</div><div class="sd up">≥85 readiness score</div></div>
    <div class="sc"><div class="si2" style="background:var(--accent-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="15" height="15"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg></div><div class="sv" style="color:var(--accent)">${avgReady}</div><div class="sl">Avg Readiness Score</div><div class="sd neu">Across all applicants</div></div>
    <div class="sc"><div class="si2" style="background:var(--teal-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" width="15" height="15"><polyline points="18,15 12,9 6,15"/></svg></div><div class="sv" style="color:var(--teal)">${improving}</div><div class="sl">Improving Trend</div><div class="sd up">Score trending upward</div></div>
    <div class="sc"><div class="si2" style="background:var(--purple-l)"><svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" width="15" height="15"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="sv" style="color:var(--purple)">${profiles.length}</div><div class="sl">Total Applicants</div><div class="sd neu">Profiles analysed</div></div>
  </div>

  <!-- Full candidate breakdown table -->
  <div class="card" style="padding:0;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 18px;background:linear-gradient(90deg,var(--surface2),var(--surface));border-bottom:1px solid var(--border);font-size:13px;font-weight:700;color:var(--text)">Complete Candidate Analysis</div>
    <div style="overflow-x:auto">
    <table style="min-width:1000px">
      <thead><tr>
        <th>Candidate</th><th>College · Dept</th>
        <th style="text-align:center">Logical<br><span style="font-weight:400;font-size:9px">/30</span></th>
        <th style="text-align:center">Quant<br><span style="font-weight:400;font-size:9px">/30</span></th>
        <th style="text-align:center">Verbal<br><span style="font-weight:400;font-size:9px">/15</span></th>
        <th style="text-align:center">DI<br><span style="font-weight:400;font-size:9px">/15</span></th>
        <th style="text-align:center">Total<br><span style="font-weight:400;font-size:9px">/90</span></th>
        <th style="text-align:center">Interview<br><span style="font-weight:400;font-size:9px">/100</span></th>
        <th style="text-align:center">Trend</th>
        <th style="text-align:center">Readiness</th>
        <th>AI Recommendation</th>
      </tr></thead>
      <tbody>
      ${profiles.sort((a, b) => b.readiness.score - a.readiness.score).map(p => {
    const subTotal = p.subjects.reduce((a, s) => a + s.v, 0);
    const tc = p.readiness.color;
    const trendColor = p.trendDir === 'up' ? 'var(--green)' : 'var(--red)';
    const scoreBar = (v, max, col) => `<div style="font-weight:700;color:${col}">${v}</div><div style="height:4px;background:var(--surface3);border-radius:2px;margin-top:2px;overflow:hidden"><div style="height:100%;width:${Math.round(v / max * 100)}%;background:${col};border-radius:2px"></div></div>`;
    return `<tr>
          <td>
            <div class="tn" style="color:var(--accent);cursor:pointer;text-decoration:underline;text-underline-offset:2px" onclick="openStudentProfile('${p.name}')">${p.name}</div>
            <div class="ts">${p.badges[0]}</div>
          </td>
          <td>
            <div style="font-size:12px;font-weight:600;color:var(--text)">${p.college}</div>
            <div style="font-size:11px;color:var(--muted)">${p.dept}</div>
          </td>
          ${p.subjects.map(s => `<td style="text-align:center">${scoreBar(s.v, s.max, s.c)}</td>`).join('')}
          <td style="text-align:center"><div style="font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:${subTotal >= 72 ? 'var(--green)' : subTotal >= 45 ? 'var(--accent)' : 'var(--red)'}">${subTotal}</div></td>
          <td style="text-align:center"><div style="font-weight:700;color:${p.ivScore >= 85 ? 'var(--green)' : p.ivScore >= 70 ? 'var(--accent)' : 'var(--amber)'}">${p.ivScore}</div></td>
          <td style="text-align:center">
            <span style="font-size:12px;font-weight:700;color:${trendColor}">${p.trendDir === 'up' ? '↑ Rising' : '↓ Dropping'}</span>
            <div style="font-size:10px;color:var(--muted)">${p.trendDelta}</div>
          </td>
          <td style="text-align:center">
            <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:${tc}">${p.readiness.score}</div>
            <div style="font-size:10px;font-weight:700;color:${tc}">${p.readiness.label}</div>
            <div style="height:4px;width:60px;background:var(--surface3);border-radius:2px;margin:3px auto 0;overflow:hidden"><div style="height:100%;width:${p.readiness.score}%;background:${tc};border-radius:2px"></div></div>
          </td>
          <td style="max-width:220px">
            <div style="font-size:11px;color:var(--muted);line-height:1.5">${p.readiness.rec}</div>
          </td>
        </tr>`;
  }).join('')}
      </tbody>
    </table>
    </div>
  </div>

  <!-- Subject-wise comparison chart -->
  <div class="g2">
    <div class="card">
      <div class="ct">Subject Breakdown — All Candidates</div>
      ${profiles.map(p => `
        <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)">
          <div style="font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:7px;display:flex;align-items:center;justify-content:space-between">
            <span style="cursor:pointer;color:var(--accent);text-decoration:underline;text-underline-offset:2px" onclick="openStudentProfile('${p.name}')">${p.name}</span>
            <span style="font-size:10.5px;color:var(--muted)">${p.college} · ${p.dept}</span>
          </div>
          ${p.subjects.map(s => `
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
              <span style="font-size:10.5px;color:var(--muted);width:82px;flex-shrink:0">${s.s}</span>
              <div style="flex:1;height:6px;background:var(--surface3);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${Math.round(s.v / s.max * 100)}%;background:${s.c};border-radius:3px"></div>
              </div>
              <span style="font-size:11px;font-weight:700;color:${s.c};min-width:32px;text-align:right">${s.v}/${s.max}</span>
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div class="card">
      <div class="ct">Score Trend — All Candidates</div>
      ${profiles.map(p => {
    const first = p.trend[0], last = p.trend[p.trend.length - 1];
    const delta = last - first; const up = delta >= 0;
    return `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:12.5px;font-weight:700;color:var(--text);cursor:pointer;text-decoration:underline;text-underline-offset:2px" onclick="openStudentProfile('${p.name}')">${p.name}</span>
            <span style="font-size:12px;font-weight:700;color:${up ? 'var(--green)' : 'var(--red)'}">${up ? '↑ +' + delta : ' ↓ ' + delta} pts</span>
          </div>
          <div style="display:flex;align-items:flex-end;gap:3px;height:40px">
            ${p.trend.map((v, i) => `<div style="flex:1;background:${i === p.trend.length - 1 ? 'var(--purple)' : 'var(--purple-l)'};border-radius:2px 2px 0 0;height:${Math.round((v - 40) / 60 * 100)}%;min-height:2px;transition:height .3s"></div>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--faint);margin-top:3px">
            <span>S1: ${p.trend[0]}</span><span>Latest: ${p.trend[p.trend.length - 1]}</span>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">${p.trendDelta}</div>
        </div>`;
  }).join('')}
    </div>
  </div>`;
}

// ════════ TOAST ════════
let toastT;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2800);
}
function startDashboardSync() {
  if (dashSyncInterval) clearInterval(dashSyncInterval);
  buildCadmDash();
  if (localPersistentState.activeScreen === 'cadm-db') buildCollegeDB();

  dashSyncInterval = setInterval(() => {
    const curScreen = localPersistentState.activeScreen;
    updateSyncStatus('Syncing...', 'var(--amber)');

    const tasks = [];
    if (curScreen === 'cadm-dash') tasks.push(buildCadmDash());
    if (curScreen === 'cadm-db') tasks.push(buildCollegeDB());

    Promise.all(tasks).finally(() => {
      setTimeout(() => updateSyncStatus('Live Sync Active', 'var(--green)'), 1000);
    });
  }, 10000);
}

function stopDashboardSync() {
  if (dashSyncInterval) {
    clearInterval(dashSyncInterval);
    dashSyncInterval = null;
  }
}

function updateSyncStatus(text, color) {
  const statusEl = document.getElementById('cadm-sync-status');
  const textEl = document.getElementById('cadm-sync-text');
  if (statusEl && textEl) {
    textEl.textContent = text;
    statusEl.style.color = color;
    const isGreen = color.includes('green');
    statusEl.style.borderColor = isGreen ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';
    statusEl.style.background = isGreen ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)';
    const dot = statusEl.querySelector('span');
    if (dot) dot.style.background = color;
  }
}


function getFilteredStudents() {
  const showApproved = document.getElementById('filter-approved')?.checked ?? true;
  const showPending = document.getElementById('filter-pending')?.checked ?? true;
  const showDenied = document.getElementById('filter-denied')?.checked ?? true;
  const sortBy = document.getElementById('cadm-sort')?.value || 'default';
  const deptMap = {};
  cadmAllStudents.forEach(s => {
    const b = s.batch || 'General';
    deptMap[b] = b.replace(/[-\s]\w*\s*\d{4}.*$/, '').replace(/\s+\d+$/, '').trim();
  });
  let filtered = cadmAllStudents.filter(s => {
    if (cadmActiveDept !== 'all' && deptMap[s.batch || 'General'] !== cadmActiveDept) return false;
    if (!showApproved && s.status === 'approved') return false;
    if (!showPending && s.status === 'pending') return false;
    if (!showDenied && s.status === 'denied') return false;
    return true;
  });
  if (sortBy === 'score-desc') filtered.sort((a, b) => (b.l + b.q + b.v + b.d) - (a.l + a.q + a.v + a.d));
  else if (sortBy === 'score-asc') filtered.sort((a, b) => (a.l + a.q + a.v + a.d) - (b.l + b.q + b.v + b.d));
  else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'roll') filtered.sort((a, b) => a.roll.localeCompare(b.roll));
  return { filtered, deptLabel: cadmActiveDept === 'all' ? 'All Departments' : cadmActiveDept, sortBy };
}

function getFilterSummary() {
  const showApproved = document.getElementById('filter-approved')?.checked ?? true;
  const showPending = document.getElementById('filter-pending')?.checked ?? true;
  const showDenied = document.getElementById('filter-denied')?.checked ?? true;
  const statuses = [];
  if (showApproved) statuses.push('Approved');
  if (showPending) statuses.push('Pending');
  if (showDenied) statuses.push('Denied');
  return { dept: cadmActiveDept === 'all' ? 'All Departments' : cadmActiveDept, status: statuses.join('+') || 'None', sort: document.getElementById('cadm-sort')?.value || 'default' };
}

const gc = { 'A+': '#0E9F6E', 'A': '#0E9F6E', 'B': '#1B6FE6', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#EF4444' };
function getGrade(score) {
  if (score >= 80) return { g: 'A+', c: '#0E9F6E' };
  if (score >= 70) return { g: 'A', c: '#0E9F6E' };
  if (score >= 60) return { g: 'B', c: '#1B6FE6' };
  if (score >= 50) return { g: 'C', c: '#F59E0B' };
  if (score >= 40) return { g: 'D', c: '#EF4444' };
  return { g: 'F', c: '#EF4444' };
}

function tc(s) {
  const total = s.l + s.q + s.v + s.d;
  if (total >= 70) return '#0E9F6E';
  if (total >= 50) return '#1B6FE6';
  return '#6B7280';
}

const wordHeader = '<style>body { font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #E5E7EB; padding: 10px; font-size: 11pt; text-align: left; } th { background: #F9FAFB; font-weight: bold; } h1 { color: #111827; font-size: 18pt; margin-bottom: 5px; } .meta { color: #6B7280; font-size: 10pt; margin-bottom: 20px; }</style>';
function cell(val, style = '') { return '<td style="' + style + '">' + val + '</td>'; }
function cCenter(val, style = '') { return '<td style="text-align:center;' + style + '">' + val + '</td>'; }
