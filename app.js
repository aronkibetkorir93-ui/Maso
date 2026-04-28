/* global supabase */

// 1. UPDATED CONFIGURATION WITH NEW KEYS
const URL = 'https://rtbbrtnxvzammsyndfsh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YmJydG54dnphbW1zeW5kZnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NjYsImV4cCI6MjA5MjkzNTQ2Nn0.A3RSWKLPQ8DKsKmj96DGFh0CT0KeTrqK3goY0_bQQsI';
const _supabase = supabase.createClient(URL, KEY);

let currentMode = 'login';

// UI Logic for toggling between Login and Signup
function toggleAuth(mode) {
    currentMode = mode;
    document.getElementById('signup-fields').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-btn').innerText = mode === 'login' ? 'Login' : 'Signup';
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
}

// Handling the Authentication Form
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    errorEl.innerText = '';

    try {
        if (currentMode === 'signup') {
            const name = document.getElementById('auth-name').value;
            const role = document.getElementById('auth-role').value;
            
            // Registering the user with metadata (name and role)
            const { error } = await _supabase.auth.signUp({
                email, 
                password, 
                options: { data: { name, role } }
            });
            
            if (error) throw error;
            alert("Signup Success! You can now Login.");
            toggleAuth('login');
        } else {
            // Logging in
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            loadApp(data.user);
        }
    } catch (err) { 
        errorEl.innerText = err.message; 
    }
}

// Initializing the App after successful login
async function loadApp(user) {
    // Fetch user profile from the public.users table created via SQL
    const { data: profile, error } = await _supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        return alert("Profile not found in database. Ensure you ran the SQL script in your new project!");
    }

    // Hide Login Screen and Show Dashboard
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('user-display').innerText = `${profile.name} (${profile.role})`;
    
    setupNav(profile.role);
    document.getElementById('content').innerHTML = `
        <div class="card">
            <h1>Welcome to Maso Portal</h1>
            <p>You are logged in as a <strong>${profile.role}</strong>.</p>
        </div>
    `;
}

// Setting up the Sidebar based on User Role
function setupNav(role) {
    const menu = document.getElementById('nav-menu');
    let items = `<div class="nav-item" onclick="location.reload()">🏠 Dashboard</div>`;
    
    if (role === 'Admin') items += `<div class="nav-item">👥 Manage Users</div>`;
    if (role === 'Teacher') items += `<div class="nav-item">📝 Enter Marks</div>`;
    if (role === 'Student') items += `<div class="nav-item">📊 View Results</div>`;
    
    menu.innerHTML = items;
}

// Sign out logic
async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// Check if user is already logged in when the page loads
window.onload = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) loadApp(session.user);
};
