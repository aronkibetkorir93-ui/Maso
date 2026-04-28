/* global supabase */

// 1. CONNECTION CONFIGURATION
const URL = 'https://rtbbrtnxvzammsyndfsh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0YmJydG54dnphbW1zeW5kZnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTk0NjYsImV4cCI6MjA5MjkzNTQ2Nn0.A3RSWKLPQ8DKsKmj96DGFh0CT0KeTrqK3goY0_bQQsI';
const _supabase = supabase.createClient(URL, KEY);

let currentMode = 'login';

// 2. TOGGLE LOGIN VS SIGNUP
function toggleAuth(mode) {
    currentMode = mode;
    const signupFields = document.getElementById('signup-fields');
    const authBtn = document.getElementById('auth-btn');
    const errorBox = document.getElementById('auth-error');
    
    errorBox.style.display = 'none';
    
    if (mode === 'login') {
        signupFields.classList.add('hidden');
        authBtn.innerText = 'Login to Portal';
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-signup').classList.remove('active');
    } else {
        signupFields.classList.remove('hidden');
        authBtn.innerText = 'Create New Account';
        document.getElementById('tab-signup').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
    }
}

// 3. AUTHENTICATION HANDLER (Signup & Login)
async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorBox = document.getElementById('auth-error');
    
    errorBox.style.display = 'none';
    errorBox.innerText = '';

    try {
        if (currentMode === 'signup') {
            const name = document.getElementById('auth-name').value;
            const role = document.getElementById('auth-role').value;

            if (!name) throw new Error("Full name is required for signup.");

            // SIGNUP LOGIC
            const { data, error } = await _supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        role: role
                    }
                }
            });

            if (error) throw error;
            
            alert("Success! Account created. Now please login with your credentials.");
            toggleAuth('login');
        } else {
            // LOGIN LOGIC
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            if (data.user) {
                loadApp(data.user);
            }
        }
    } catch (err) {
        errorBox.innerText = err.message;
        errorBox.style.display = 'block';
    }
}

// 4. LOAD DASHBOARD DATA
async function loadApp(user) {
    // Show Loading
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    // Fetch the detailed profile from the public.users table
    const { data: profile, error } = await _supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        alert("Wait! Your profile wasn't found in the database. Did you run the SQL script in your Supabase project?");
        logout();
        return;
    }

    // Update UI with user info
    document.getElementById('user-display-name').innerText = profile.name;
    document.getElementById('user-display-role').innerText = profile.role;
    document.getElementById('page-title').innerText = `${profile.role} Dashboard`;

    renderNavigation(profile.role);
    renderContent(profile);
}

// 5. ROLE-BASED NAVIGATION
function renderNavigation(role) {
    const nav = document.getElementById('nav-menu');
    let items = `<div class="nav-item" onclick="location.reload()">🏠 Home</div>`;
    
    if (role === 'Admin') {
        items += `
            <div class="nav-item" onclick="alert('Managing Users...')">👥 User Management</div>
            <div class="nav-item" onclick="alert('School Settings...')">⚙️ System Settings</div>
        `;
    } else if (role === 'Teacher') {
        items += `
            <div class="nav-item" onclick="alert('Class list loading...')">📖 My Classes</div>
            <div class="nav-item" onclick="alert('Marks entry open...')">📝 Enter Marks</div>
        `;
    } else if (role === 'DOS') {
        items += `
            <div class="nav-item" onclick="alert('Exam schedules...')">📅 Exam Planning</div>
            <div class="nav-item" onclick="alert('Report cards...')">📋 Verify Results</div>
        `;
    } else {
        items += `
            <div class="nav-item" onclick="alert('Academic records...')">📊 My Results</div>
            <div class="nav-item" onclick="alert('Fee statement...')">💰 Fee Portal</div>
        `;
    }
    
    nav.innerHTML = items;
}

// 6. DASHBOARD CONTENT
function renderContent(profile) {
    const content = document.getElementById('content-viewport');
    content.innerHTML = `
        <div class="card">
            <h2>Welcome back, ${profile.name}!</h2>
            <p style="color: #64748b; margin-top: 10px;">
                You are currently logged into the <strong>Maso Secondary School Portal</strong> 
                as a <strong>${profile.role}</strong>. Use the sidebar to navigate through your tasks.
            </p>
        </div>
    `;
}

// 7. LOGOUT
async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

// 8. AUTO-LOGIN ON REFRESH
window.onload = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        loadApp(session.user);
    }
};
