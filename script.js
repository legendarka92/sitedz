// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFvlT_GVqwY3kDqotqvHNYRHQ_-Jw6jXk",
    authDomain: "class9g-schedule-db.firebaseapp.com",
    databaseURL: "https://class9g-schedule-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "class9g-schedule-db",
    storageBucket: "class9g-schedule-db.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef0123456789"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Constants
const ADMIN_CODE = '123';
let scheduleData = null;
let currentDay = 'monday';

// Initial schedule data
const initialSchedule = {
    "monday": [
        {"name": "Алгебра", "time": "8:00", "homework": ""},
        {"name": "Русский язык", "time": "8:55", "homework": ""},
        {"name": "История", "time": "9:50", "homework": ""},
        {"name": "Английский язык", "time": "10:45", "homework": ""},
        {"name": "Литература", "time": "11:40", "homework": ""},
        {"name": "География", "time": "12:35", "homework": ""},
        {"name": "Химия", "time": "13:30", "homework": ""},
        {"name": "ЭЛЕКТИВ ФИЗИКА", "time": "14:25", "homework": ""}
    ],
    "tuesday": [
        {"name": "Геометрия", "time": "8:00", "homework": ""},
        {"name": "Биология", "time": "8:55", "homework": ""},
        {"name": "Физика", "time": "9:50", "homework": ""},
        {"name": "Русский язык", "time": "10:45", "homework": ""},
        {"name": "История", "time": "11:40", "homework": ""},
        {"name": "Физкультура", "time": "12:35", "homework": ""},
        {"name": "ЭЛЕКТИВ ИНФОРМАТИКА", "time": "13:30", "homework": ""}
    ],
    "wednesday": [
        {"name": "Алгебра", "time": "8:00", "homework": ""},
        {"name": "Информатика", "time": "8:55", "homework": ""},
        {"name": "Английский язык", "time": "9:50", "homework": ""},
        {"name": "Литература", "time": "10:45", "homework": ""},
        {"name": "География", "time": "11:40", "homework": ""},
        {"name": "ОБЖ", "time": "12:35", "homework": ""},
        {"name": "Физкультура", "time": "13:30", "homework": ""}
    ],
    "thursday": [
        {"name": "Геометрия", "time": "8:00", "homework": ""},
        {"name": "Химия", "time": "8:55", "homework": ""},
        {"name": "Физика", "time": "9:50", "homework": ""},
        {"name": "Биология", "time": "10:45", "homework": ""},
        {"name": "Русский язык", "time": "11:40", "homework": ""},
        {"name": "История", "time": "12:35", "homework": ""},
        {"name": "ЭЛЕКТИВ ОБЩЕСТВОЗНАНИЕ", "time": "13:30", "homework": ""}
    ],
    "friday": [
        {"name": "Алгебра", "time": "8:00", "homework": ""},
        {"name": "Литература", "time": "8:55", "homework": ""},
        {"name": "Английский язык", "time": "9:50", "homework": ""},
        {"name": "Информатика", "time": "10:45", "homework": ""},
        {"name": "География", "time": "11:40", "homework": ""},
        {"name": "Физкультура", "time": "12:35", "homework": ""},
        {"name": "Обществознание", "time": "13:30", "homework": ""}
    ]
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        // Check if data exists in Firebase
        const snapshot = await database.ref('schedule').once('value');
        if (!snapshot.exists()) {
            // If no data exists, initialize with default schedule
            await database.ref('schedule').set(initialSchedule);
        }
        
        // Now load the schedule and set up listeners
        loadSchedule();
        setupTabListeners();
        checkSavedLogin();
    } catch (error) {
        console.error('Error initializing app:', error);
        // If Firebase fails, use local data
        scheduleData = initialSchedule;
        displaySchedule(currentDay);
    }
}

// Load schedule data
async function loadSchedule() {
    try {
        // Subscribe to Firebase updates
        const scheduleRef = database.ref('schedule');
        scheduleRef.on('value', (snapshot) => {
            scheduleData = snapshot.val() || initialSchedule;
            displaySchedule(currentDay);
        }, (error) => {
            console.error('Error loading schedule:', error);
            // If Firebase fails, use local data
            scheduleData = initialSchedule;
            displaySchedule(currentDay);
        });
    } catch (error) {
        console.error('Error setting up schedule listener:', error);
        // If Firebase fails, use local data
        scheduleData = initialSchedule;
        displaySchedule(currentDay);
    }
}

// Setup tab listeners
function setupTabListeners() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDay = tab.dataset.day;
            displaySchedule(currentDay);
        });
    });
}

// Display schedule for selected day
function displaySchedule(day) {
    const container = document.getElementById('schedule-content');
    const daySchedule = scheduleData[day];
    
    if (!daySchedule) {
        container.innerHTML = 'Нет данных для этого дня';
        return;
    }

    const days = {
        'monday': 'Понедельник',
        'tuesday': 'Вторник',
        'wednesday': 'Среда',
        'thursday': 'Четверг',
        'friday': 'Пятница'
    };

    const dayElement = document.createElement('div');
    dayElement.className = 'schedule-day';
    dayElement.innerHTML = `
        <h2>${days[day]}</h2>
        ${daySchedule.map((lesson, index) => `
            <div class="lesson-item">
                <div class="lesson-info">
                    <strong>${lesson.time}</strong> - ${lesson.name}
                </div>
                <div class="lesson-homework" id="${day}-${index}">
                    ${lesson.homework || 'Нет домашнего задания'}
                </div>
            </div>
        `).join('')}
    `;
    
    container.innerHTML = '';
    container.appendChild(dayElement);
}

// Check for saved login
function checkSavedLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'flex';
    }
}

// Login functionality
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

function login() {
    const code = document.getElementById('admin-code').value;
    const rememberLogin = document.getElementById('remember-login').checked;
    
    if (code === ADMIN_CODE) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'flex';
        document.getElementById('admin-code').value = '';
        
        if (rememberLogin) {
            localStorage.setItem('isLoggedIn', 'true');
        }
    } else {
        alert('Неверный код!');
    }
}

function logout() {
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('admin-nav').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'none';
    localStorage.removeItem('isLoggedIn');
    showMainContent();
}

// Admin panel functionality
function showAdminPanel() {
    document.getElementById('schedule-container').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    updateLessonSelect();
}

function showMainContent() {
    document.getElementById('schedule-container').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
}

function updateLessonSelect() {
    const daySelect = document.getElementById('day-select');
    const lessonSelect = document.getElementById('lesson-select');
    const selectedDay = daySelect.value;
    const lessons = scheduleData[selectedDay];

    lessonSelect.innerHTML = lessons.map((lesson, index) => `
        <option value="${index}">${lesson.time} - ${lesson.name}</option>
    `).join('');
}

// Add event listeners for admin controls
document.getElementById('day-select').addEventListener('change', updateLessonSelect);

// Add homework functionality
async function addHomework() {
    const daySelect = document.getElementById('day-select');
    const lessonSelect = document.getElementById('lesson-select');
    const homeworkInput = document.getElementById('homework-input');
    
    const selectedDay = daySelect.value;
    const selectedLessonIndex = parseInt(lessonSelect.value);
    const homework = homeworkInput.value.trim();

    if (!homework) {
        alert('Введите домашнее задание!');
        return;
    }

    try {
        // Update Firebase
        await database.ref(`schedule/${selectedDay}/${selectedLessonIndex}/homework`).set(homework);
        
        // Clear input
        homeworkInput.value = '';
        
        // Show success message
        alert('Домашнее задание добавлено!');
    } catch (error) {
        console.error('Error saving homework:', error);
        alert('Ошибка при сохранении домашнего задания');
    }
} 