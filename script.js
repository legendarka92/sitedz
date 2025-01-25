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
    setupConnectionStatus();
});

// Setup connection status monitoring
function setupConnectionStatus() {
    const connectedRef = database.ref('.info/connected');
    const statusDiv = document.createElement('div');
    statusDiv.className = 'connection-status';
    document.querySelector('.container').appendChild(statusDiv);

    connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
            statusDiv.textContent = 'Онлайн';
            statusDiv.className = 'connection-status online';
        } else {
            statusDiv.textContent = 'Офлайн';
            statusDiv.className = 'connection-status offline';
        }
    });
}

async function initializeApp() {
    try {
        // Check if data exists in Firebase
        const snapshot = await database.ref('schedule').once('value');
        if (!snapshot.exists()) {
            // If no data exists, initialize with default schedule
            await database.ref('schedule').set(initialSchedule);
            console.log('Initial schedule data loaded to Firebase');
        }
        
        // Now load the schedule and set up listeners
        await setupRealtimeSync();
        setupTabListeners();
        checkSavedLogin();
        updateLessonSelect(); // Initialize lesson select if admin
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Ошибка подключения к базе данных. Используются локальные данные.');
        // If Firebase fails, use local data
        scheduleData = initialSchedule;
        displaySchedule(currentDay);
    }
}

// Setup realtime synchronization
async function setupRealtimeSync() {
    const scheduleRef = database.ref('schedule');
    
    // Listen for all data changes
    scheduleRef.on('value', (snapshot) => {
        scheduleData = snapshot.val() || initialSchedule;
        displaySchedule(currentDay);
        console.log('Schedule updated from Firebase');
    });

    // Listen for specific homework changes
    scheduleRef.on('child_changed', (snapshot) => {
        const dayKey = snapshot.key;
        const dayData = snapshot.val();
        
        // Update only if the changed day is currently displayed
        if (dayKey === currentDay) {
            displaySchedule(currentDay);
        }
        
        // Show notification if homework was changed
        const changedLesson = dayData.find(lesson => lesson.homework);
        if (changedLesson) {
            showNotification(`Добавлено новое ДЗ по предмету: ${changedLesson.name}`);
        }
    });
}

// Show notification function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
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
        // Show loading state
        const submitButton = document.querySelector('.admin-controls button');
        submitButton.disabled = true;
        submitButton.textContent = 'Сохранение...';

        // Update Firebase
        await database.ref(`schedule/${selectedDay}/${selectedLessonIndex}/homework`).set(homework);
        
        // Clear input and reset button
        homeworkInput.value = '';
        submitButton.disabled = false;
        submitButton.textContent = 'Добавить ДЗ';
        
        // Show success message
        showNotification('Домашнее задание успешно добавлено!');
    } catch (error) {
        console.error('Error saving homework:', error);
        alert('Ошибка при сохранении домашнего задания. Попробуйте еще раз.');
    }
} 