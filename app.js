/* global supabase */

// 1. VARIABLES MUST BE AT THE TOP (The Fix)
let currentMode = 'login'; 
let currentProfile = null;

// 2. CONNECTION CONFIGURATION
const URL = 'https://rtbbrtnxvzammsyndfsh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YmJydG54dnphbW1zeW5kZnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NjYsImV4cCI6MjA5MjkzNTQ2Nn0.A3RSWKLPQ8DKsKmj96DGFh0CT0KeTrqK3goY0_bQQsI';
const _supabase = supabase.createClient(URL, KEY);

// 3. TOGGLE LOGIN VS SIGNUP
function toggleAuth(mode) {
    currentMode = mode; // Now the computer knows what this is!
    const signupFields = document.getElementById('signup-fields');
    const authBtn = document.getElementById('auth-btn');
    const errorBox = document.getElementById('auth-error');
    
    if (errorBox) errorBox.style.display = 'none';
    
    if (mode === 'login') {
        if (signupFields) signupFields.classList.add('hidden');
        authBtn.innerText = 'Login to Portal';
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-signup').classList.remove('active');
    } else {
        if (signupFields) signupFields.classList.remove('hidden');
        authBtn.innerText = 'Create New Account';
        document.getElementById('tab-signup').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
    }
}

// 4. AUTHENTICATION HANDLER
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorBox = document.getElementById('auth-error');
    
    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.innerText = '';
    }

    try {
        if (currentMode === 'signup') {
            const name = document.getElementById('auth-name').value;
            const role = document.getElementById('auth-role').value;

            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { name: name, role: role } }
            });

            if (error) throw error;
            alert("Success! Account created. Now login.");
            toggleAuth('login');
        } else {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) loadApp(data.user);
        }
    } catch (err) {
        if (errorBox) {
            errorBox.innerText = err.message;
            errorBox.style.display = 'block';
        } else {
            alert(err.message);
        }
    }
}

// 5. LOAD DASHBOARD
async function loadApp(user) {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    const { data: profile, error } = await _supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        alert("Profile error. Make sure your SQL script was run!");
        return;
    }

    document.getElementById('user-display-name').innerText = profile.name;
    document.getElementById('user-display-role').innerText = profile.role;
    
    setupNav(profile.role);
}

function setupNav(role) {
    const nav = document.getElementById('nav-menu');
    let items = `<div class="nav-item" onclick="location.reload()">🏠 Home</div>`;
    if (role === 'Admin') items += `<div class="nav-item">👥 Manage Users</div>`;
    nav.innerHTML = items;
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

window.onload = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) loadApp(session.user);
};
