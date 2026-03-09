// Get elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsSidebar = document.getElementById('settingsSidebar');
const closeSettings = document.getElementById('closeSettings');
const overlay = document.getElementById('overlay');
const settingsContainer = document.querySelector('.settings-container');
const themeSelect = document.getElementById('themeSelect');

// Open settings
settingsToggle.addEventListener('click', () => {
    settingsSidebar.classList.add('active');
    overlay.classList.add('active');
    settingsContainer.classList.add('hidden');
});

// Close settings
closeSettings.addEventListener('click', () => {
    settingsSidebar.classList.remove('active');
    overlay.classList.remove('active');
    settingsContainer.classList.remove('hidden');
});

// Close settings when clicking overlay
overlay.addEventListener('click', () => {
    settingsSidebar.classList.remove('active');
    overlay.classList.remove('active');
    settingsContainer.classList.remove('hidden');
});

// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        settingsSidebar.classList.remove('active');
        overlay.classList.remove('active');
        settingsContainer.classList.remove('hidden');
    }
});

// Theme functionality
function applyTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'auto') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
        body.classList.add(`${theme}-theme`);
    }
    
    // Update HanziWriter colors if available
    if (typeof window.updateWriterColors === 'function') {
        window.updateWriterColors();
    }
    
    const consent = localStorage.getItem("cookieConsent");
    // Save theme preference
    if (consent === "accepted")
        localStorage.setItem('selectedTheme', theme);
}

// Load saved theme on page load
function loadTheme() {
    if(localStorage.getItem('selectedTheme')) {
        const savedTheme = localStorage.getItem('selectedTheme') || 'light';
        console.log("Loading theme:", savedTheme);
        themeSelect.value = savedTheme;
        applyTheme(savedTheme);
    }
    else {
        console.log("No theme found, setting auto");
        applyTheme('auto');
    }
}

// Theme change event listener
themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
});

// Load theme when page loads
document.addEventListener('DOMContentLoaded', loadTheme);

// Save progress function
function saveProgress() {
    const consent = localStorage.getItem("cookieConsent");
    
    if (consent === "accepted") {
        // Save the current progress
        localStorage.setItem("currentIndex", currentIndex);
        localStorage.setItem("targetLang", _targetLang);
        
        // Show success message
        alert("Progress saved successfully!");
        console.log("Progress saved: currentIndex =", currentIndex, ", targetLang =", _targetLang);
    } else {
        // Show error message and offer to accept cookies
        const acceptCookies = confirm(
            "Cookies have not been accepted. Progress cannot be saved without cookie consent.\n\n" +
            "Would you like to accept cookies now to enable progress saving?"
        );
        
        if (acceptCookies) {
            // Show the cookie consent popup again
            const cookiePopup = document.getElementById("cookie-popup");
            if (cookiePopup) {
                cookiePopup.style.display = "block";
            }
        }
    }
}

// Progress button event listeners
document.getElementById('saveProgress').addEventListener('click', saveProgress);

document.getElementById('deleteProgress').addEventListener('click', () => {
    console.log('Delete Progress clicked - functionality to be implemented');
    // TODO: Add delete progress functionality
});

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    console.log('Save Settings clicked - functionality to be implemented');
    // TODO: Add save settings functionality
});

document.getElementById('resetSettingsBtn').addEventListener('click', () => {
    console.log('Reset Settings clicked - functionality to be implemented');
    // TODO: Add reset settings functionality
});

// Sound effects toggle
document.getElementById('soundEffects').addEventListener('change', (e) => {
    // Access soundEffects from mainpage.js
    if (typeof soundEffects !== 'undefined') {
        soundEffects.enabled = e.target.checked;
        console.log('Sound effects', e.target.checked ? 'enabled' : 'disabled');
    }
});