// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_1YTXiDHxWPqDtTe4S0QNoRrdYbXPyRE",
    authDomain: "class9g-schedule-real.firebaseapp.com",
    databaseURL: "https://class9g-schedule-real-default-rtdb.firebaseio.com",
    projectId: "class9g-schedule-real",
    storageBucket: "class9g-schedule-real.appspot.com",
    messagingSenderId: "1048532828587",
    appId: "1:1048532828587:web:a1b2c3d4e5f6a7b8c9d0e1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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

// Initialize app
function initializeApp() {
    setupTheme();
    setupConnectionStatus();
    setupRealtimeSync();
    setupEventListeners();
    showSchedule(currentDay);
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

// Setup connection status
function setupConnectionStatus() {
    const connectedRef = database.ref('.info/connected');
    connectedRef.on('value', (snap) => {
        isOnline = snap.val();
        connectionStatus.textContent = isOnline ? 'Онлайн' : 'Офлайн';
        connectionStatus.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    });
}

// Setup realtime sync
function setupRealtimeSync() {
    const scheduleRef = database.ref('schedule');
    scheduleRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            showSchedule(currentDay, data);
        } else {
            showSchedule(currentDay);
        }
    }, (error) => {
        console.error('Error loading schedule:', error);
        showSchedule(currentDay);
    });

    const homeworkRef = database.ref('homework');
    homeworkRef.on('child_added', (snapshot) => {
        const homework = snapshot.val();
        showNotification(`Новое домашнее задание по предмету: ${homework.subject}`);
        showSchedule(currentDay);
    });

    homeworkRef.on('child_changed', (snapshot) => {
        const homework = snapshot.val();
        showNotification(`Обновлено домашнее задание по предмету: ${homework.subject}`);
        showSchedule(currentDay);
    });
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
    loginForm.addEventListener('submit', handleLogin);

    // Login button
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });

    // Logout button
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal on outside click
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    // Admin panel
    if (adminPanel) {
        const daySelect = document.getElementById('daySelect');
        const lessonSelect = document.getElementById('lessonSelect');
        const homeworkInput = document.getElementById('homeworkInput');
        const addHomeworkBtn = document.getElementById('addHomeworkBtn');

        daySelect.addEventListener('change', () => {
            updateLessonSelect(daySelect.value, lessonSelect);
        });

        addHomeworkBtn.addEventListener('click', () => {
            const day = daySelect.value;
            const lessonName = lessonSelect.value;
            const homework = homeworkInput.value.trim();

            if (homework && lessonName) {
                addHomework(day, lessonName, homework);
                homeworkInput.value = '';
            }
        });
    }
}

// Show schedule
function showSchedule(day, firebaseData = null) {
    const schedule = firebaseData || localSchedule;
    const daySchedule = schedule[day];
    
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

    daySchedule.forEach(lesson => {
        const homework = getHomework(day, lesson.name);
        html += `
            <div class="lesson-item">
                <div class="lesson-info">
                    <span class="lesson-time">${lesson.time}</span>
                    <span class="lesson-name">${lesson.name}</span>
                </div>
                <div class="lesson-homework">${homework || ''}</div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    scheduleContent.innerHTML = html;
}

// Get homework
function getHomework(day, subject) {
    const homework = localStorage.getItem(`homework_${day}_${subject}`);
    return homework || '';
}

// Add homework
function addHomework(day, subject, homework) {
    if (!isAdmin) return;

    const homeworkRef = database.ref('homework').push();
    homeworkRef.set({
        day,
        subject,
        homework,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        showNotification('Домашнее задание успешно добавлено');
    }).catch(error => {
        console.error('Error adding homework:', error);
        showNotification('Ошибка при добавлении домашнего задания', 'error');
    });
}

// Update lesson select
function updateLessonSelect(day, select) {
    const lessons = localSchedule[day];
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
    
    if (password === 'admin123') {
        isAdmin = true;
        loginModal.style.display = 'none';
        adminPanel.style.display = 'block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        localStorage.setItem('isAdmin', 'true');
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
    adminPanel.style.display = 'block';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 