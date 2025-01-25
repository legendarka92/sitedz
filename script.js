// Constants
const ADMIN_CODE = '123';
const SCHEDULE_URL = 'data/schedule.json';
let scheduleData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
});

// Load schedule data
async function loadSchedule() {
    try {
        const response = await fetch(SCHEDULE_URL);
        scheduleData = await response.json();
        displaySchedule();
        setupRealTimeUpdates();
    } catch (error) {
        console.error('Error loading schedule:', error);
        document.getElementById('schedule-container').innerHTML = 'Ошибка загрузки расписания';
    }
}

// Display schedule
function displaySchedule() {
    const container = document.getElementById('schedule-container');
    container.innerHTML = '';

    const days = {
        'monday': 'Понедельник',
        'tuesday': 'Вторник',
        'wednesday': 'Среда',
        'thursday': 'Четверг',
        'friday': 'Пятница'
    };

    for (const [dayKey, dayName] of Object.entries(days)) {
        const daySchedule = scheduleData[dayKey];
        if (!daySchedule) continue;

        const dayElement = document.createElement('div');
        dayElement.className = 'schedule-day';
        dayElement.innerHTML = `
            <h2>${dayName}</h2>
            ${daySchedule.map((lesson, index) => `
                <div class="lesson-item">
                    <div class="lesson-info">
                        <strong>${lesson.time}</strong> - ${lesson.name}
                    </div>
                    <div class="lesson-homework" id="${dayKey}-${index}">
                        ${lesson.homework || 'Нет домашнего задания'}
                    </div>
                </div>
            `).join('')}
        `;
        container.appendChild(dayElement);
    }
}

// Login functionality
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

function login() {
    const code = document.getElementById('admin-code').value;
    if (code === ADMIN_CODE) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'flex';
        document.getElementById('admin-code').value = '';
    } else {
        alert('Неверный код!');
    }
}

function logout() {
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('admin-nav').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'none';
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
function addHomework() {
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

    // Update local data
    scheduleData[selectedDay][selectedLessonIndex].homework = homework;
    
    // Update display
    const homeworkElement = document.getElementById(`${selectedDay}-${selectedLessonIndex}`);
    if (homeworkElement) {
        homeworkElement.textContent = homework;
    }

    // Clear input
    homeworkInput.value = '';
    
    // Save changes (in a real application, this would send to a server)
    saveChanges(selectedDay, selectedLessonIndex, homework);
}

// Real-time updates setup
function setupRealTimeUpdates() {
    // In a real application, this would use WebSocket or Server-Sent Events
    // For demo purposes, we'll use polling
    setInterval(checkForUpdates, 5000);
}

async function checkForUpdates() {
    try {
        const response = await fetch(SCHEDULE_URL);
        const newData = await response.json();
        
        // Compare and update if different
        if (JSON.stringify(newData) !== JSON.stringify(scheduleData)) {
            scheduleData = newData;
            displaySchedule();
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// Save changes (in a real application, this would send to a server)
async function saveChanges(day, lessonIndex, homework) {
    try {
        // In a real application, this would be an API call
        console.log('Saving changes:', {
            day,
            lessonIndex,
            homework
        });
        
        // For demo purposes, we're just updating the local data
        // In a real application, this would be a POST request to your server
    } catch (error) {
        console.error('Error saving changes:', error);
        alert('Ошибка при сохранении изменений');
    }
} 