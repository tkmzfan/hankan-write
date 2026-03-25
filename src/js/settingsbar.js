// Get elements
const settingsToggle = document.getElementById('settingsToggle');
const settingsSidebar = document.getElementById('settingsSidebar');
const closeSettings = document.getElementById('closeSettings');
const overlay = document.getElementById('overlay');
const settingsContainer = document.querySelector('.settings-container');
const themeSelect = document.getElementById('themeSelect');
const languageSelect = document.getElementById('languageSelect');

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

// Language functionality
function applyLanguage(language) {
    console.log('Changing language to:', language);
    
    // Show loading cursor
    document.body.style.cursor = 'wait';
    
    // Check if exercise session is active and end it
    if (window.exerciseSession && window.exerciseSession.active) {
        console.log('Ending active exercise session before changing language');
        if (typeof window.endExercise === 'function') {
            window.endExercise();
        }
    }
    
    // Reset to index 0 when changing language
    window.currentIndex = 0;
    
    // Save language preference
    const consent = localStorage.getItem("cookieConsent");
    if (consent === "accepted") {
        localStorage.setItem('selectedLanguage', language);
        localStorage.setItem('currentIndex', '0'); // Save the reset index
    }
    
    // Call setLang function from mainpage.js
    if (typeof window.setLang === 'function') {
        window.setLang(language).then(() => {
            console.log('Language changed successfully');
            
            // Update grade dropdown options
            if (typeof window.updateGradeDropdown === 'function') {
                window.updateGradeDropdown();
                console.log('Grade dropdown updated');
            }
            
            // Clear and repopulate character list
            const grid = document.getElementById("kanji-grid");
            if (grid && typeof window.populateList === 'function') {
                grid.innerHTML = "";
                window.populateList(0, 100);
                console.log('Character list updated');
            }
            
            // Set to first character (index 0)
            if (typeof window.setHanzi === 'function' && window.hanziList && window.hanziList.length > 0) {
                window.setHanzi(window.hanziList[0]);
                console.log('Reset to first character');
            }
            
            // Hide loading cursor
            document.body.style.cursor = 'default';
        }).catch(error => {
            console.error('Failed to change language:', error);
            // Hide loading cursor even on error
            document.body.style.cursor = 'default';
        });
    } else {
        console.warn('setLang function not available - waiting for mainpage.js to load');
        // Retry after a short delay
        setTimeout(() => {
            if (typeof window.setLang === 'function') {
                applyLanguage(language);
            } else {
                console.error('setLang function still not available');
                // Hide loading cursor if we give up
                document.body.style.cursor = 'default';
            }
        }, 500);
    }
}

// Load saved language on page load
function loadLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'jp';
    console.log("Loading language:", savedLanguage);
    languageSelect.value = savedLanguage;
    // Don't auto-apply on load to avoid conflicts with URL parameters
}

// Function to update language dropdown state
function updateLanguageDropdownState() {
    const isExerciseActive = window.exerciseSession && window.exerciseSession.active;
    languageSelect.disabled = isExerciseActive;
    
    if (isExerciseActive) {
        languageSelect.title = "Language cannot be changed during an exercise session";
    } else {
        languageSelect.title = "";
    }
}

// Language change event listener
languageSelect.addEventListener('change', (e) => {
    console.log('Language dropdown changed to:', e.target.value);
    
    // Disable the dropdown during language change
    languageSelect.disabled = true;
    
    applyLanguage(e.target.value);
    
    // Re-enable dropdown after a delay to allow language change to complete
    setTimeout(() => {
        updateLanguageDropdownState(); // This will re-enable unless exercise is active
    }, 2000);
});

// Periodically check exercise session state to update dropdown
setInterval(updateLanguageDropdownState, 500);

// Load theme and language when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing settings...');
    loadTheme();
    loadLanguage();
    
    // Double-check language dropdown binding
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        console.log('Language dropdown found and bound');
    } else {
        console.error('Language dropdown not found!');
    }
    
    // Initial dropdown state update
    updateLanguageDropdownState();
});

// Progress button event listeners
document.getElementById('deleteProgress').addEventListener('click', () => {
    console.log('Delete Progress clicked - functionality to be implemented');
    // TODO: Add delete progress functionality
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