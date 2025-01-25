// Supabase configuration
const supabaseUrl = 'https://qvqfxvbhwxjxvzqvjpzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cWZ4dmJod3hqeHZ6cXZqcHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYyMDc5NzAsImV4cCI6MjAyMTc4Mzk3MH0.Ry8SQy1YvEVxVVZNGGVHWZlF3TZhQ5QZy5ZXQ5ZXQ5Y';
const supabase = createClient(supabaseUrl, supabaseKey);

// Local schedule data
const localSchedule = {
    monday: [
        { time: "8:30 - 9:15", name: "Математика" },
        { time: "9:25 - 10:10", name: "Физика" },
        { time: "10:20 - 11:05", name: "История" },
        { time: "11:25 - 12:10", name: "Английский язык" },
        { time: "12:20 - 13:05", name: "Литература" },
        { time: "13:15 - 14:00", name: "Информатика" }
    ],
    tuesday: [
        { time: "8:30 - 9:15", name: "Биология" },
        { time: "9:25 - 10:10", name: "Химия" },
        { time: "10:20 - 11:05", name: "Математика" },
        { time: "11:25 - 12:10", name: "География" },
        { time: "12:20 - 13:05", name: "Физкультура" },
        { time: "13:15 - 14:00", name: "Русский язык" }
    ],
    wednesday: [
        { time: "8:30 - 9:15", name: "История" },
        { time: "9:25 - 10:10", name: "Математика" },
        { time: "10:20 - 11:05", name: "Физика" },
        { time: "11:25 - 12:10", name: "Английский язык" },
        { time: "12:20 - 13:05", name: "Информатика" },
        { time: "13:15 - 14:00", name: "Литература" }
    ],
    thursday: [
        { time: "8:30 - 9:15", name: "Химия" },
        { time: "9:25 - 10:10", name: "Биология" },
        { time: "10:20 - 11:05", name: "Математика" },
        { time: "11:25 - 12:10", name: "География" },
        { time: "12:20 - 13:05", name: "Физкультура" },
        { time: "13:15 - 14:00", name: "Русский язык" }
    ],
    friday: [
        { time: "8:30 - 9:15", name: "Физика" },
        { time: "9:25 - 10:10", name: "История" },
        { time: "10:20 - 11:05", name: "Математика" },
        { time: "11:25 - 12:10", name: "Английский язык" },
        { time: "12:20 - 13:05", name: "Литература" },
        { time: "13:15 - 14:00", name: "Информатика" }
    ]
};

// DOM Elements
const scheduleContent = document.querySelector('.schedule-content');
const dayTabs = document.querySelectorAll('.tab-btn');
const adminPanel = document.querySelector('.admin-section');
const loginModal = document.querySelector('.modal');
const loginForm = document.querySelector('.login-form');
const loginBtn = document.querySelector('.login-btn');
const logoutBtn = document.querySelector('.logout-btn');
const themeSwitcher = document.querySelector('.theme-switcher');
const connectionStatus = document.querySelector('.connection-status');

// Current state
let currentDay = 'monday';
let isAdmin = false;
let isOnline = false;

// Database and sync configuration
const DB_NAME = 'scheduleDB';
const DB_VERSION = 1;
const WS_URL = 'wss://schedule-sync.glitch.me';

let db;
let ws;

// Initialize IndexedDB
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('homework')) {
                const store = db.createObjectStore('homework', { keyPath: 'id', autoIncrement: true });
                store.createIndex('by_day_subject', ['day', 'subject'], { unique: true });
            }
        };
    });
}

// Initialize WebSocket connection
function initWebSocket() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        isOnline = true;
        updateConnectionStatus();
        syncData(); // Синхронизируем данные при подключении
    };

    ws.onclose = () => {
        isOnline = false;
        updateConnectionStatus();
        // Пытаемся переподключиться через 5 секунд
        setTimeout(initWebSocket, 5000);
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'homework_update') {
            await updateHomework(data.homework);
            showNotification('Получено новое домашнее задание');
            showSchedule(currentDay);
        }
    };
}

// Update connection status
function updateConnectionStatus() {
    connectionStatus.textContent = isOnline ? 'Онлайн' : 'Офлайн';
    connectionStatus.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
}

// Sync data with server
async function syncData() {
    if (!isOnline) return;

    try {
        // Получаем все локальные изменения
        const tx = db.transaction('homework', 'readonly');
        const store = tx.objectStore('homework');
        const items = await store.getAll();

        // Отправляем на сервер
        ws.send(JSON.stringify({
            type: 'sync',
            data: items
        }));
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Initialize app
async function initializeApp() {
    try {
        await initDB();
        initWebSocket();
        setupTheme();
        setupEventListeners();
        showSchedule(currentDay);
        
        // Initialize lesson select on load
        const daySelect = document.getElementById('daySelect');
        const lessonSelect = document.getElementById('lessonSelect');
        if (daySelect && lessonSelect) {
            updateLessonSelect(daySelect.value, lessonSelect);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Ошибка при инициализации приложения', 'error');
    }
}

// Setup theme
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Day tabs
    dayTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dayTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDay = tab.dataset.day;
            showSchedule(currentDay);
        });
    });

    // Theme switcher
    themeSwitcher.addEventListener('click', toggleTheme);

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
    }

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Close modal on outside click
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }

    // Admin panel
    if (adminPanel) {
        const daySelect = document.getElementById('daySelect');
        const lessonSelect = document.getElementById('lessonSelect');
        const homeworkInput = document.getElementById('homeworkInput');
        const addHomeworkBtn = document.getElementById('addHomeworkBtn');

        if (daySelect && lessonSelect) {
            daySelect.addEventListener('change', () => {
                updateLessonSelect(daySelect.value, lessonSelect);
            });
        }

        if (addHomeworkBtn && daySelect && lessonSelect && homeworkInput) {
            addHomeworkBtn.addEventListener('click', async () => {
                const day = daySelect.value;
                const lessonName = lessonSelect.value;
                const homework = homeworkInput.value.trim();

                if (homework && lessonName) {
                    await addHomework(day, lessonName, homework);
                    homeworkInput.value = '';
                } else {
                    showNotification('Пожалуйста, заполните все поля', 'error');
                }
            });
        }
    }
}

// Show schedule
async function showSchedule(day) {
    const daySchedule = localSchedule[day];
    
    if (!daySchedule) {
        scheduleContent.innerHTML = '<p class="no-schedule">Расписание на этот день отсутствует</p>';
        return;
    }

    const dayNames = {
        monday: 'Понедельник',
        tuesday: 'Вторник',
        wednesday: 'Среда',
        thursday: 'Четверг',
        friday: 'Пятница'
    };

    let html = `
        <div class="schedule-day">
            <h2>${dayNames[day]}</h2>
            <div class="lessons-list">
    `;

    for (const lesson of daySchedule) {
        const homework = await getHomework(day, lesson.name);
        html += `
            <div class="lesson-item">
                <div class="lesson-info">
                    <span class="lesson-time">${lesson.time}</span>
                    <span class="lesson-name">${lesson.name}</span>
                </div>
                <div class="lesson-homework">${homework || ''}</div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    scheduleContent.innerHTML = html;
}

// Get homework
async function getHomework(day, subject) {
    try {
        const tx = db.transaction('homework', 'readonly');
        const store = tx.objectStore('homework');
        const index = store.index('by_day_subject');
        const request = index.get([day, subject]);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.homework : '');
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting homework:', error);
        return '';
    }
}

// Add homework
async function addHomework(day, subject, homework) {
    if (!isAdmin) {
        showNotification('У вас нет прав для добавления домашнего задания', 'error');
        return;
    }

    try {
        const homeworkData = {
            day,
            subject,
            homework,
            timestamp: Date.now()
        };

        // Сохраняем локально
        const tx = db.transaction('homework', 'readwrite');
        const store = tx.objectStore('homework');
        await store.put(homeworkData);

        // Отправляем на сервер если онлайн
        if (isOnline) {
            ws.send(JSON.stringify({
                type: 'new_homework',
                data: homeworkData
            }));
        }

        showNotification('Домашнее задание успешно добавлено');
        showSchedule(currentDay);
    } catch (error) {
        console.error('Error adding homework:', error);
        showNotification('Ошибка при добавлении домашнего задания', 'error');
    }
}

// Update homework from server
async function updateHomework(homeworkData) {
    try {
        const tx = db.transaction('homework', 'readwrite');
        const store = tx.objectStore('homework');
        await store.put(homeworkData);
    } catch (error) {
        console.error('Error updating homework:', error);
    }
}

// Update lesson select
function updateLessonSelect(day, select) {
    if (!select) return;
    
    const lessons = localSchedule[day];
    if (!lessons) return;

    select.innerHTML = lessons.map(lesson => 
        `<option value="${lesson.name}">${lesson.name}</option>`
    ).join('');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (password === '') {
        showNotification('Введите пароль', 'error');
        return;
    }
    
    if (password === 'admin') {
        isAdmin = true;
        loginModal.style.display = 'none';
        adminPanel.style.display = 'block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        if (rememberMe) {
            localStorage.setItem('isAdmin', 'true');
        }
        
        showNotification('Вы успешно вошли как администратор');
    } else {
        showNotification('Неверный пароль', 'error');
    }
}

// Handle logout
function handleLogout() {
    isAdmin = false;
    adminPanel.style.display = 'none';
    loginBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    localStorage.removeItem('isAdmin');
    showNotification('Вы вышли из системы');
}

// Check admin status on load
if (localStorage.getItem('isAdmin') === 'true') {
    isAdmin = true;
    if (adminPanel) adminPanel.style.display = 'block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 