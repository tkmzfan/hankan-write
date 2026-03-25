// Exercise Session System
import { DragResizePanel } from './drag-resize-panel.js';

// Exercise Session Variables
var exerciseSession = {
    active: false,
    mode: 'normal', // 'normal' or 'timed'
    kanjiList: [],
    currentExerciseIndex: 0,
    completed: new Set(),
    originalIndex: 0,
    originalHanziList: null,
    // Timer properties
    timePerCharacter: 5,
    currentTimeLeft: 0,
    timerId: null,
    isTimerActive: false
};

// Initialize drag and resize functionality for exercise panel
let exercisePanel = null;

function initializeExercisePanel() {
    const panel = document.getElementById('exerciseGridBox');
    if (panel && !exercisePanel) {
        exercisePanel = new DragResizePanel('exerciseGridBox');
        console.log('Exercise panel drag/resize initialized');
    }
    
    // Initialize mode selection event listener
    const modeSelect = document.getElementById('exerciseMode');
    if (modeSelect) {
        modeSelect.addEventListener('change', function() {
            const timedSettings = document.getElementById('timedSettings');
            if (this.value === 'timed') {
                timedSettings.style.display = 'flex';
            } else {
                timedSettings.style.display = 'none';
            }
        });
    }
}

// Exercise Session Functions
function startExercise() {
    const mode = document.getElementById('exerciseMode').value;
    const gradeLevel = document.getElementById('gradeLevel').value;
    const exerciseCount = parseInt(document.getElementById('exerciseCount').value);
    const timePerChar = parseInt(document.getElementById('timePerCharacter').value);
    
    // Get current data from main module
    const { hanziData, hanziList, _targetLang, currentIndex, setHanzi, startQuiz } = window.getMainData();
    
    if (!hanziData || hanziData.length === 0) {
        alert("Character data not loaded. Please wait for data to load before starting an exercise.");
        return;
    }
    
    let filteredCharacters = [];
    let gradeName = "";
    
    // Filter characters by grade level based on language
    switch(_targetLang) {
        case "jp":
            gradeName = `JLPT N${gradeLevel}`;
            for (let i = 0; i < hanziData.length; i++) {
                const kanjiInfo = hanziData[i];
                if (kanjiInfo && kanjiInfo.jlpt_new == gradeLevel) {
                    filteredCharacters.push({
                        character: hanziList[i],
                        index: i,
                        data: kanjiInfo
                    });
                }
            }
            break;
        
        case "trad":
        case "simp":
            gradeName = `HSK ${gradeLevel}`;
            for (let i = 0; i < hanziList.length; i++) {
                const character = hanziList[i];
                const charInfo = hanziData[character];
                if (charInfo && charInfo.hsk == gradeLevel) {
                    filteredCharacters.push({
                        character: character,
                        index: i,
                        data: charInfo
                    });
                }
            }
            break;
            
        default:
            alert("Exercise sessions are not available for this language.");
            return;
    }
    
    if (filteredCharacters.length === 0) {
        alert(`No characters found for ${gradeName}`);
        return;
    }
    
    if (filteredCharacters.length < exerciseCount) {
        alert(`Only ${filteredCharacters.length} characters available for ${gradeName}. Adjusting count.`);
    }
    
    // Randomly select characters for the exercise
    const shuffled = [...filteredCharacters].sort(() => Math.random() - 0.5);
    const selectedCharacters = shuffled.slice(0, Math.min(exerciseCount, filteredCharacters.length));
    
    // Initialize exercise session
    exerciseSession.active = true;
    exerciseSession.mode = mode;
    exerciseSession.kanjiList = selectedCharacters;
    exerciseSession.currentExerciseIndex = 0;
    exerciseSession.completed = new Set();
    exerciseSession.originalIndex = currentIndex;
    exerciseSession.originalHanziList = hanziList;
    exerciseSession.timePerCharacter = timePerChar;
    
    // Switch to the first exercise character
    window.updateCurrentIndex(selectedCharacters[0].index);
    setHanzi(selectedCharacters[0].character);
    startQuiz();
    
    populateExerciseGrid();
    updateExerciseProgress();
    
    // Initialize timer for timed mode
    if (mode === 'timed') {
        initializeTimer();
        startTimer();
    } else {
        // Hide timer display for normal mode
        document.getElementById('timerDisplay').style.display = 'none';
    }
    
    // Update UI
    document.getElementById('startExercise').disabled = true;
    console.log(`Started ${mode} exercise with ${selectedCharacters.length} ${gradeName} characters`);
}

function populateExerciseGrid() {
    const grid = document.getElementById("exercise-grid");
    grid.innerHTML = "";
    
    const { setHanzi, quizOn } = window.getMainData();
    
    exerciseSession.kanjiList.forEach((kanjiInfo, index) => {
        const item = document.createElement("div");
        item.className = "exercise-item";
        item.textContent = kanjiInfo.character;
        
        // Mark current character
        if (index === exerciseSession.currentExerciseIndex) {
            item.classList.add("current");
        }
        
        // Mark completed characters
        if (exerciseSession.completed.has(index)) {
            item.classList.add("completed");
        }
        
        // Add click functionality to jump to character
        item.addEventListener("click", () => {
            exerciseSession.currentExerciseIndex = index;
            window.updateCurrentIndex(kanjiInfo.index);
            setHanzi(kanjiInfo.character);
            updateExerciseGrid();
            quizOn();
            
            // Reset timer for timed mode when clicking on character
            if (exerciseSession.mode === 'timed') {
                resetTimer();
            }
        });
        
        // Add tooltip with readings
        const jpData = kanjiInfo.data;
        const kun = jpData.wk_readings_kun || "";
        const on = jpData.wk_readings_on || "";
        const tooltipText = `Kun: ${kun}${kun && on ? ", " : ""}On: ${on}`;
        item.title = tooltipText;
        
        grid.appendChild(item);
    });
}

function updateExerciseGrid() {
    const items = document.querySelectorAll('.exercise-item');
    items.forEach((item, index) => {
        item.classList.remove('current');
        if (index === exerciseSession.currentExerciseIndex) {
            item.classList.add('current');
        }
    });
}

function updateExerciseProgress() {
    const completed = exerciseSession.completed.size;
    const total = exerciseSession.kanjiList.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${completed}/${total}`;
}

function completeCurrentExercise() {
    if (!exerciseSession.active) return;
    
    exerciseSession.completed.add(exerciseSession.currentExerciseIndex);
    updateExerciseProgress();
    updateExerciseGrid();
    
    // In timed mode, add extra time bonus for completion
    if (exerciseSession.mode === 'timed') {
        const bonusTime = Math.floor(exerciseSession.timePerCharacter * 0.3); // 30% bonus
        exerciseSession.currentTimeLeft = Math.min(
            exerciseSession.currentTimeLeft + bonusTime, 
            exerciseSession.timePerCharacter
        );
        updateTimerDisplay();
    }
    
    // Check if exercise is complete
    if (exerciseSession.completed.size === exerciseSession.kanjiList.length) {
        // Play session completion sound
        const soundEffects = window.getSoundEffects();
        if (soundEffects) {
            soundEffects.playSessionComplete();
        }
        
        alert("Exercise completed! Great work!");
        endExercise();
        return;
    }
    
    // Move to next unfinished character
    moveToNextExerciseCharacter();
}

function moveToNextExerciseCharacter() {
    if (!exerciseSession.active) return;
    
    const { setHanzi } = window.getMainData();
    
    // Find next incomplete character
    let nextIndex = (exerciseSession.currentExerciseIndex + 1) % exerciseSession.kanjiList.length;
    
    // Look for an incomplete character
    let attempts = 0;
    while (exerciseSession.completed.has(nextIndex) && attempts < exerciseSession.kanjiList.length) {
        nextIndex = (nextIndex + 1) % exerciseSession.kanjiList.length;
        attempts++;
    }
    
    if (!exerciseSession.completed.has(nextIndex)) {
        exerciseSession.currentExerciseIndex = nextIndex;
        const kanjiInfo = exerciseSession.kanjiList[nextIndex];
        window.updateCurrentIndex(kanjiInfo.index);
        setHanzi(kanjiInfo.character);
        updateExerciseGrid();
        
        // Reset timer for timed mode
        if (exerciseSession.mode === 'timed') {
            resetTimer();
        }
    }
}

function endExercise() {
    exerciseSession.active = false;
    
    // Clean up timer
    stopTimer();
    
    const { hanziList, setHanzi } = window.getMainData();
    
    // Restore original state
    window.updateCurrentIndex(exerciseSession.originalIndex);
    
    // Clear exercise grid
    document.getElementById("exercise-grid").innerHTML = "";
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0/0';
    
    // Hide timer display
    document.getElementById('timerDisplay').style.display = 'none';
    
    // Re-enable start button
    document.getElementById('startExercise').disabled = false;
    
    // Set back to original character
    setHanzi(hanziList[exerciseSession.originalIndex]);
}

// Modified navigation functions to work with exercise
function handleExerciseNavigation(increment) {
    if (!exerciseSession.active) return false;
    
    const { setHanzi } = window.getMainData();
    
    if (increment > 0) {
        moveToNextExerciseCharacter();
    } else {
        // Move to previous incomplete character
        let prevIndex = (exerciseSession.currentExerciseIndex - 1 + exerciseSession.kanjiList.length) % exerciseSession.kanjiList.length;
        let attempts = 0;
        while (exerciseSession.completed.has(prevIndex) && attempts < exerciseSession.kanjiList.length) {
            prevIndex = (prevIndex - 1 + exerciseSession.kanjiList.length) % exerciseSession.kanjiList.length;
            attempts++;
        }
        
        if (!exerciseSession.completed.has(prevIndex)) {
            exerciseSession.currentExerciseIndex = prevIndex;
            const kanjiInfo = exerciseSession.kanjiList[prevIndex];
            window.updateCurrentIndex(kanjiInfo.index);
            setHanzi(kanjiInfo.character);
            updateExerciseGrid();
            
            // Reset timer for timed mode when navigating manually
            if (exerciseSession.mode === 'timed') {
                resetTimer();
            }
        }
    }
    return true;
}

// Timer Functions for Timed Mode
function initializeTimer() {
    exerciseSession.currentTimeLeft = exerciseSession.timePerCharacter;
    const timerDisplay = document.getElementById('timerDisplay');
    timerDisplay.style.display = 'flex';
    updateTimerDisplay();
}

function startTimer() {
    if (exerciseSession.mode !== 'timed') return;
    
    exerciseSession.isTimerActive = true;
    exerciseSession.timerId = setInterval(() => {
        exerciseSession.currentTimeLeft -= 0.1;
        
        if (exerciseSession.currentTimeLeft <= 0) {
            // Time's up!
            handleTimeOut();
        } else {
            updateTimerDisplay();
        }
    }, 100);
}

function stopTimer() {
    if (exerciseSession.timerId) {
        clearInterval(exerciseSession.timerId);
        exerciseSession.timerId = null;
    }
    exerciseSession.isTimerActive = false;
}

function resetTimer() {
    stopTimer();
    exerciseSession.currentTimeLeft = exerciseSession.timePerCharacter;
    updateTimerDisplay();
    startTimer();
}

function updateTimerDisplay() {
    const timerText = document.getElementById('timerText');
    const timerProgress = document.getElementById('timerProgress');
    const timerCircle = document.querySelector('.timer-circle');
    
    if (!timerText || !timerProgress || !timerCircle) return;
    
    const timeLeft = Math.ceil(Math.max(0, exerciseSession.currentTimeLeft));
    timerText.textContent = timeLeft;
    
    // Update progress circle
    const percentage = exerciseSession.currentTimeLeft / exerciseSession.timePerCharacter;
    const circumference = 113.1; // 2 * Math.PI * 18
    const offset = circumference * (1 - percentage);
    timerProgress.style.strokeDashoffset = offset;
    
    // Update colors based on time remaining
    timerCircle.classList.remove('warning', 'danger');
    if (percentage <= 0.2) {
        timerCircle.classList.add('danger');
    } else if (percentage <= 0.5) {
        timerCircle.classList.add('warning');
    }
}

function handleTimeOut() {
    stopTimer();
    
    // Play mistake sound to indicate time out
    const soundEffects = window.getSoundEffects();
    if (soundEffects) {
        soundEffects.playMistake();
    }
    
    // Show time out message
    const completedCount = exerciseSession.completed.size;
    const totalCount = exerciseSession.kanjiList.length;
    alert(`Time's up! You completed ${completedCount} out of ${totalCount} characters.`);
    
    endExercise();
}

// Export functions and variables for use in main module
export {
    exerciseSession,
    initializeExercisePanel,
    startExercise,
    populateExerciseGrid,
    updateExerciseGrid,
    updateExerciseProgress,
    completeCurrentExercise,
    moveToNextExerciseCharacter,
    endExercise,
    handleExerciseNavigation
};