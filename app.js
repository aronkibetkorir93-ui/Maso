/* global supabase */

// 1. DATABASE CONFIGURATION
const SUPABASE_URL = 'https://hofjwcloqdjhywpomwim.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZmp3Y2xvcWRqaHl3cG9td2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTExMDAsImV4cCI6MjA5Mjg4NzEwMH0.YcPbUmB49anG3WddvBQp3mTwj0If9v0BNHKE_jkr4iU';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. STATE MANAGEMENT
let currentProfile = null;
let currentMode = 'login';

const el = id => document.getElementById(id);

// 3. AUTHENTICATION UI TOGGLE
function toggleAuth(mode) {
    currentMode = mode;
    el('auth-error').innerText = '';
    if(mode === 'login') {
        el('tab-login').classList.add('active');
        el('tab-signup').classList.remove('active');
        el('signup-fields').classList.add('hidden');
        el('auth-btn').innerText = 'Login to Portal';
    } else {
        el('tab-signup').classList.add('active');
        el('tab-login').classList.remove('active');
        el('signup-fields').classList.remove('hidden');
        el('auth-btn').innerText = 'Create Account';
    }
}

// 4. CORE AUTH LOGIC
async function handleAuth(e) {
    e.preventDefault();
    const email = el('auth-email').value.trim();
    const password = el('auth-password').value;
    el('auth-error').innerText = 'Processing...';

    try {
        if (currentMode === 'signup') {
            const name = el('auth-name').value;
            const role = el('auth-role').value;
            
            const { data, error } = await _supabase.auth.signUp({
                email,
                password,
                options: { data: { name, role } }
            });

            if (error) throw error;
            alert("Account created! You can now login.");
            toggleAuth('login');
        } else {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            // Login success - App will auto-initialize via session listener
            await initializeApp(data.user);
        }
    } catch (err) {
        el('auth-error').innerText = err.message;
    }
}

// 5. INITIALIZE DASHBOARD
async function initializeApp(user) {
    const { data: profile, error } = await _supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        el('auth-error').innerText = "Profile not found. If you just signed up, try logging in again.";
        return;
    }

    currentProfile = profile;
    el('user-info').innerText = `${profile.name}\n[${profile.role}]`;
    
    el('auth-container').classList.add('hidden');
    el('app-container').classList.remove('hidden');

    renderNavigation(profile.role);
    loadHome(profile.role);
}

// 6. ROLE-BASED UI
function renderNavigation(role) {
    const nav = el('nav-menu');
    let html = `<div class="nav-item" onclick="loadHome('${role}')">🏠 Dashboard</div>`;
    
    if (role === 'Admin') {
        html += `<div class="nav-item" onclick="viewUsers()">👥 Manage Users</div>`;
    } else if (role === 'Teacher') {
        html += `<div class="nav-item" onclick="alert('Subject portal opening soon...')">📝 Enter Marks</div>`;
    } else if (role === 'DOS') {
        html += `<div class="nav-item" onclick="alert('Approval queue empty')">✅ Approvals</div>`;
    } else {
        html += `<div class="nav-item" onclick="alert('Results not yet released')">📊 View Results</div>`;
    }
    nav.innerHTML = html;
}

function loadHome(role) {
    el('page-title').innerText = `${role} Control Panel`;
    el('content-area').innerHTML = `
        <div class="card">
            <h1>Jambo, ${currentProfile.name}</h1>
            <p>Welcome to the Maso Secondary School Management Portal.</p>
        </div>
    `;
}

async function viewUsers() {
    el('page-title').innerText = 'User Management';
    const { data } = await _supabase.from('users').select('*');
    let html = `<div class="card"><table><tr><th>Name</th><th>Email</th><th>Role</th></tr>`;
    data.forEach(u => {
        html += `<tr><td>${u.name}</td><td>${u.email}</td><td><strong>${u.role}</strong></td></tr>`;
    });
    el('content-area').innerHTML = html + `</table></div>`;
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// 7. AUTO-LOGIN CHECK
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) initializeApp(session.user);
});
  
