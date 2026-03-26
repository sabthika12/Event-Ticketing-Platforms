const API_URL = '/backend/api'; 

// State
let currentUser = JSON.parse(localStorage.getItem('eventify_user')) || null;

let isLoginMode = true;

// Utility functions
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.textContent = message;
    notif.className = `notification show ${type}`;
    setTimeout(() => {
        notif.className = 'notification';
    }, 3000);
}

// Navigation & Auth State
function updateNav() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (currentUser) {
        navLinks.innerHTML = `
            <a href="index.html">Events</a>
            <a href="add-event.html" style="color: var(--primary-color); font-weight: 600;">+ Post Event</a>
            <a href="dashboard.html">Dashboard</a>
            <a href="#" onclick="logout()" class="btn btn-outline" style="padding: 5px 15px;">Logout</a>
        `;
    } else {
        navLinks.innerHTML = `
            <a href="index.html">Events</a>
            <a href="add-event.html" style="color: var(--primary-color); font-weight: 600;">+ Post Event</a>
            <a href="login.html" id="login-btn" class="btn btn-outline" style="padding: 5px 15px;">Login</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('eventify_user');
    currentUser = null;
    showNotification('Logged out successfully');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Modals
function openLoginModal() {
    document.getElementById('auth-modal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('auth-modal').classList.remove('active');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Login' : 'Register';
    document.getElementById('auth-toggle').innerText = isLoginMode ? "Don't have an account? Register" : "Already have an account? Login";
    document.getElementById('auth-submit').innerText = isLoginMode ? 'Login' : 'Register';
    
    if (isLoginMode) {
        document.getElementById('name-group').classList.add('d-none');
    } else {
        document.getElementById('name-group').classList.remove('d-none');
    }
}

// Auth Requests
const authForm = document.getElementById('auth-form');
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            email: document.getElementById('auth-email').value,
            password: document.getElementById('auth-pass').value
        };

        let action = 'login';
        if (!isLoginMode) {
            action = 'register';
            payload.name = document.getElementById('auth-name').value;
        }

        try {
            const res = await fetch(`${API_URL}/auth.php?action=${action}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            
            if (data.error) throw new Error(data.error);
            
            showNotification(data.message);
            closeLoginModal();
            
            if (action === 'login') {
                currentUser = data.user;
                localStorage.setItem('eventify_user', JSON.stringify(currentUser));
                updateNav();
                
                if(window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '/d:/End%20to%20End/frontend/index.html'){
                    if(currentUser.role === 'Admin'){
                        window.location.href = 'dashboard.html';
                    }
                }
            } else {
                toggleAuthMode(); // Switch to login
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

// Load Events (Public)
async function loadEventsPublic() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    try {
        const res = await fetch(`${API_URL}/events.php`);
        const events = await res.json();
        
        grid.innerHTML = '';
        if(events.length === 0){
            grid.innerHTML = '<p>No events found.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card glass';
            card.innerHTML = `
                <h3 class="card-title">${event.title}</h3>
                <div class="card-meta">
                    <span>📅 ${event.date} at ${event.time}</span>
                    <span>📍 ${event.venue}</span>
                    <span>🎫 ${event.available_seats} / ${event.seats} seats available</span>
                </div>
                <div class="card-price">₹${Number(event.price).toFixed(2)}</div>
                <button class="btn btn-primary" style="width:100%" onclick="bookEvent(${event.id}, '${event.title}', ${event.price})">Book Ticket</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = `<p style="color:red">Error loading events: ${e.message}</p>`;
    }
}

// Booking Logic
let activeBooking = null;

function bookEvent(eventId, title, price) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Set active booking info
    activeBooking = { eventId, title, price };
    
    // Open Payment Modal
    document.getElementById('pay-amount').innerText = `₹${Number(price).toFixed(2)}`;
    document.getElementById('payment-subtitle').innerText = `Ticket for: ${title}`;
    document.getElementById('payment-form').reset();
    document.getElementById('payment-modal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('active');
    activeBooking = null;
}

const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!activeBooking) return;
        
        const submitBtn = document.getElementById('pay-submit-btn');
        submitBtn.innerHTML = `<span>Processing...</span>`;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        // Simulate 1.5 second secure payment processing delay
        setTimeout(async () => {
            try {
                // Pre-process API calls
                const res = await fetch(`${API_URL}/bookings.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        user_id: currentUser.id,
                        event_id: activeBooking.eventId,
                        tickets_count: 1
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // Simulate Payment storage in DB
                const payRes = await fetch(`${API_URL}/payment.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        booking_id: data.booking_id,
                        success: true
                    }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const payData = await payRes.json();
                if (payData.error) throw new Error(payData.error);
                
                showNotification('Payment Verified! Ticket Booked Successfully.', 'success');
                closePaymentModal();
                loadEventsPublic(); // Refresh available seats globally

            } catch (error) {
                showNotification(error.message, 'error');
            } finally {
                // Restore Button State
                submitBtn.innerHTML = `<span>Pay Now</span>`;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                activeBooking = null; // Reset
            }
        }, 1500);
    });
}


// --- DASHBOARD LOGIC ---
function initDashboard() {
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('user-greeting').innerText = `Welcome, ${currentUser.name}`;

    if (currentUser.role === 'Admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        loadAdminEvents();
        loadAnalytics();
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    loadMyBookings();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('d-none'));
    document.getElementById(`tab-${tabId}`).classList.remove('d-none');
    
    document.querySelectorAll('.sidebar-nav a').forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

async function loadMyBookings() {
    const list = document.getElementById('bookings-list');
    if (!list) return;

    try {
        // If admin, they might want to see all bookings, but here we show "My Bookings"
        const res = await fetch(`${API_URL}/bookings.php?user_id=${currentUser.id}`);
        const bookings = await res.json();
        
        list.innerHTML = '';
        if(bookings.length === 0){
            list.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        bookings.forEach(b => {
            const card = document.createElement('div');
            card.className = 'card glass';
            card.innerHTML = `
                <h3 class="card-title">${b.title}</h3>
                <div class="card-meta">
                    <span>📅 ${b.date} at ${b.time}</span>
                    <span>📍 ${b.venue}</span>
                    <span>🎟️ ${b.tickets_count} Ticket(s)</span>
                </div>
                <div class="card-price">Total: ₹${Number(b.total_price).toFixed(2)}</div>
                <p>Status: Completed</p>
                <button class="btn btn-outline" style="width:100%" onclick="alert('Downloading PDF for booking #${b.id}')">⬇ Download Ticket</button>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        list.innerHTML = `<p style="color:red">Error loading bookings</p>`;
    }
}

// Admin Events Management
async function loadAdminEvents() {
    const list = document.getElementById('admin-events-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_URL}/events.php`);
        const events = await res.json();
        
        list.innerHTML = '';
        events.forEach(e => {
            list.innerHTML += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px;">${e.title}</td>
                    <td>${e.date} ${e.time}</td>
                    <td>${e.venue}</td>
                    <td>₹${e.price}</td>
                    <td>${e.available_seats} / ${e.seats}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteEvent(${e.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
    }
}

async function deleteEvent(id) {
    if(confirm('Are you sure you want to delete this event?')) {
        try {
            const res = await fetch(`${API_URL}/events.php?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showNotification('Event deleted!');
            loadAdminEvents();
        } catch (e) {
            showNotification(e.message, 'error');
        }
    }
}

function openEventModal() {
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-modal-title').innerText = 'Create Event';
    document.getElementById('event-modal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

const eventForm = document.getElementById('event-form');
if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            venue: document.getElementById('event-venue').value,
            price: document.getElementById('event-price').value,
            seats: document.getElementById('event-seats').value,
            description: document.getElementById('event-desc').value,
        };

        const id = document.getElementById('event-id').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/events.php?id=${id}` : `${API_URL}/events.php`;

        try {
            const res = await fetch(url, {
                method: method,
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            showNotification('Event saved successfully');
            closeEventModal();
            loadAdminEvents();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    });
}

async function loadAnalytics() {
    try {
        const res = await fetch(`${API_URL}/payment.php`);
        const data = await res.json();
        
        if(data.total_revenue) {
            document.getElementById('total-revenue').innerText = `₹${Number(data.total_revenue).toFixed(2)}`;
        }
    } catch (e) {
        console.error(e);
    }
}

// Init Nav
updateNav();
if(document.getElementById('events-grid')) {
    loadEventsPublic();
}

