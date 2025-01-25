// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJ9lF6e1H_uGkDCx7wkpRf3qVIZzO-5eo",
    authDomain: "class9g-schedule.firebaseapp.com",
    databaseURL: "https://class9g-schedule-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "class9g-schedule",
    storageBucket: "class9g-schedule.appspot.com",
    messagingSenderId: "447128777439",
    appId: "1:447128777439:web:8b0c0e0f0f0f0f0f0f0f0f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Constants
const ADMIN_CODE = '123';
let scheduleData = null;
let currentDay = 'monday';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
    setupTabListeners();
    checkSavedLogin();
});

// Load schedule data
async function loadSchedule() {
    try {
        // Subscribe to Firebase updates
        const scheduleRef = database.ref('schedule');
        scheduleRef.on('value', (snapshot) => {
            scheduleData = snapshot.val() || {};
            displaySchedule(currentDay);
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('schedule-content').innerHTML = 'Ошибка загрузки расписания';
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