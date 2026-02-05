// ====== ПЕРЕКЛЮЧЕННЯ ТЕМИ ======
let currentTheme = localStorage.getItem('theme') || 'light';

function initTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    updateThemeIcon();
}

function toggleTheme() {
    if (currentTheme === 'light') {
        currentTheme = 'dark';
        document.body.classList.add('dark-theme');
    } else {
        currentTheme = 'light';
        document.body.classList.remove('dark-theme');
    }
    
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
        toggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    });
}

// ====== МЕНЮ ПРОФІЛЮ ======
function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('profile-menu');
    menu.classList.toggle('show');
}

// Закриття меню при кліку поза ним
document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-menu');
    if (menu && !e.target.closest('.profile-wrapper')) {
        menu.classList.remove('show');
    }
});

// ====== СЛАЙДЕР КАТЕГОРІЙ ======
let categoryPosition = 0;

function scrollCategories(direction) {
    const track = document.getElementById('categories-track');
    const wrapper = document.querySelector('.categories-wrapper');
    const cardWidth = 275; // 250px + 25px gap
    const visibleCards = Math.floor(wrapper.offsetWidth / cardWidth);
    const totalCards = track.children.length;
    const maxPosition = Math.max(0, totalCards - visibleCards);
    
    categoryPosition += direction;
    categoryPosition = Math.max(0, Math.min(categoryPosition, maxPosition));
    
    const offset = -categoryPosition * cardWidth;
    track.style.transform = `translateX(${offset}px)`;
}

// ====== ІНІЦІАЛІЗАЦІЯ ======
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});