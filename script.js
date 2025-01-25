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
let isOnline = true; // Supabase всегда работает в офлайн режиме с локальным кэшем

// Initialize app
async function initializeApp() {
    setupTheme();
    setupConnectionStatus();
    await setupRealtimeSync();
    setupEventListeners();
    showSchedule(currentDay);
    
    // Initialize lesson select on load
    const daySelect = document.getElementById('daySelect');
    const lessonSelect = document.getElementById('lessonSelect');
    if (daySelect && lessonSelect) {
        updateLessonSelect(daySelect.value, lessonSelect);
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

// Setup connection status
function setupConnectionStatus() {
    // Supabase работает офлайн, поэтому всегда показываем статус "онлайн"
    connectionStatus.textContent = 'Онлайн';
    connectionStatus.className = 'connection-status online';
}

// Setup realtime sync
async function setupRealtimeSync() {
    // Подписываемся на изменения в таблице homework
    const subscription = supabase
        .channel('homework_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, 
            payload => {
                if (payload.eventType === 'INSERT') {
                    showNotification(`Новое домашнее задание по предмету: ${payload.new.subject}`);
                } else if (payload.eventType === 'UPDATE') {
                    showNotification(`Обновлено домашнее задание по предмету: ${payload.new.subject}`);
                }
                refreshHomework();
            }
        )
        .subscribe();

    // Загружаем текущие домашние задания
    await refreshHomework();
}

// Refresh homework data
async function refreshHomework() {
    try {
        const { data, error } = await supabase
            .from('homework')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Обновляем локальное хранилище
        if (data) {
            data.forEach(hw => {
                localStorage.setItem(`homework_${hw.day}_${hw.subject}`, hw.homework);
            });
        }

        // Обновляем отображение
        showSchedule(currentDay);
    } catch (error) {
        console.error('Error refreshing homework:', error);
        showNotification('Ошибка при загрузке домашних заданий', 'error');
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
function showSchedule(day) {
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
    return localStorage.getItem(`homework_${day}_${subject}`) || '';
}

// Add homework
async function addHomework(day, subject, homework) {
    if (!isAdmin) {
        showNotification('У вас нет прав для добавления домашнего задания', 'error');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('homework')
            .upsert([
                {
                    day,
                    subject,
                    homework,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        // Update local storage immediately
        localStorage.setItem(`homework_${day}_${subject}`, homework);
        showNotification('Домашнее задание успешно добавлено');
        showSchedule(currentDay);
    } catch (error) {
        console.error('Error adding homework:', error);
        showNotification('Ошибка при добавлении домашнего задания', 'error');
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