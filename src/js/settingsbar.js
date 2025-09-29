// Get elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsSidebar = document.getElementById('settingsSidebar');
const closeSettings = document.getElementById('closeSettings');
const overlay = document.getElementById('overlay');

// Open settings
settingsToggle.addEventListener('click', () => {
    settingsSidebar.classList.add('active');
    overlay.classList.add('active');
});

// Close settings
closeSettings.addEventListener('click', () => {
    settingsSidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Close settings when clicking overlay
overlay.addEventListener('click', () => {
    settingsSidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        settingsSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});