const consent = localStorage.getItem("cookieConsent");
if(consent == "accepted" && localStorage.getItem("currentIndex")) {
    currentIndex = parseInt(localStorage.getItem("currentIndex"), 10);
}
if(consent == "accepted" && localStorage.getItem("targetLang")) {
    _targetLang = localStorage.getItem("targetLang");
}

var radicalColored = false;
var currentStroke = 0;
var currentIndex = 0; 

var hanziList = null;
var hanziData = null;

var _targetLang = null;

// Exercise Session Variables
var exerciseSession = {
    active: false,
    kanjiList: [],
    currentExerciseIndex: 0,
    completed: new Set(),
    originalIndex: 0,
    originalHanziList: null
};

// Sound Effects System
class SoundEffects {
    constructor() {
        this.enabled = true;
        this.completionSound = document.getElementById('completionSound');
        this.mistakeSound = document.getElementById('mistakeSound');
        this.sessionCompleteSound = document.getElementById('sessionCompleteSound');
        
        // Create synthetic tones if audio elements fail
        this.audioContext = null;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playCompletion() {
        if (!this.enabled) return;
        
        if (this.completionSound && this.completionSound.readyState >= 2) {
            this.completionSound.currentTime = 0;
            this.completionSound.play().catch(() => {
                // Fallback to synthetic tone
                this.playTone(523.25, 0.2); // C5 note
            });
        } else {
            // Fallback: pleasant ascending tone
            this.playTone(523.25, 0.15);
            setTimeout(() => this.playTone(659.25, 0.15), 100);
        }
    }
    
    playMistake() {
        if (!this.enabled) return;
        
        if (this.mistakeSound && this.mistakeSound.readyState >= 2) {
            this.mistakeSound.currentTime = 0;
            this.mistakeSound.play().catch(() => {
                // Fallback to synthetic tone
                this.playTone(220, 0.3, 'sawtooth'); // A3 note, harsh sound
            });
        } else {
            // Fallback: descending error tone
            this.playTone(220, 0.2, 'sawtooth');
            setTimeout(() => this.playTone(196, 0.2, 'sawtooth'), 150);
        }
    }
    
    playSessionComplete() {
        if (!this.enabled) return;
        
        if (this.sessionCompleteSound && this.sessionCompleteSound.readyState >= 2) {
            this.sessionCompleteSound.currentTime = 0;
            this.sessionCompleteSound.play().catch(() => {
                // Fallback to synthetic melody
                this.playCompletionMelody();
            });
        } else {
            this.playCompletionMelody();
        }
    }
    
    playHint() {
        if (!this.enabled) return;
        
        // Subtle hint sound - soft bell-like tone
        this.playTone(880, 0.1, 'sine'); // A5 note, very brief
    }
    
    playHint() {
        if (!this.enabled) return;
        
        // Subtle hint sound - soft bell-like tone
        this.playTone(880, 0.1, 'sine'); // A5 note, very brief
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Initialize sound effects
const soundEffects = new SoundEffects();

const targetWidth = 450;
const targetHeight = 450;

const svg = document.getElementById('grid-background-target');
svg.setAttribute('width', targetWidth);
svg.setAttribute('height', targetHeight);

const target = document.getElementById('target');
target.style.width = targetWidth + 'px';
target.style.height = targetHeight + 'px';

var writer = writer = HanziWriter.create("writer-container", "一", {
    width: targetWidth,
    height: targetHeight,
    showOutline: false,
    showCharacter: false,
    showHintAfterMisses: false,
    strokeColor: '#000',
    delayBetweenStrokes: 250,
    strokeAnimationSpeed: 0.75,
});

// Function to update HanziWriter colors based on theme
function updateWriterColors() {
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        writer.updateColor('strokeColor', '#ffffff');
        writer.updateColor('outlineColor', '#666666');
        writer.updateColor('highlightColor', '#4A90E2');
        writer.updateColor('drawingColor', '#ffffff');
    } else {
        writer.updateColor('strokeColor', '#000000');
        writer.updateColor('outlineColor', '#DDD');
        writer.updateColor('highlightColor', '#AAF');
        writer.updateColor('drawingColor', '#333333');
    }
}

// Make function globally available
window.updateWriterColors = updateWriterColors;

// Apply initial theme colors
setTimeout(updateWriterColors, 100);

//coming from index page
const urlParams = new URLSearchParams(window.location.search);
try {
    await setLang(urlParams.get('lang'));
    startQuiz();
} catch (error) {
    console.error('Failed to initialize application:', error);
}

async function startQuiz() {
target.style.display = 'block';

if(consent == "accepted" && localStorage.getItem("currentIndex")) {
  currentIndex = parseInt(localStorage.getItem("currentIndex"), 10);
}
if(consent == "accepted" && localStorage.getItem("targetLang")) {
  _targetLang = localStorage.getItem("targetLang");
}

// Safety checks for data loading
if (!hanziList || hanziList.length === 0) {
    console.error("Hanzi list not loaded or empty");
    return;
}

// Ensure currentIndex is within bounds
if (currentIndex < 0 || currentIndex >= hanziList.length) {
    console.warn("CurrentIndex out of bounds, resetting to 0");
    currentIndex = 0;
}

console.log(hanziList[0]);
setHanzi(hanziList[currentIndex]);

writer.showOutline();

if(radicalColored)
        writer.updateColor('radicalColor', '#D00')

writer.animateCharacter({
    onComplete: function() {
    writer.updateColor('radicalColor', '#000')
    quizOn();
    }
});

populateList(0,100);
}

function delay(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

function quizOn() {
currentStroke = 0;
writer.quiz({
    onComplete: function() {
        // Play completion sound
        soundEffects.playCompletion();
        
        if(radicalColored)
        writer.updateColor('radicalColor', '#D00')

        next(2000,1,true)
    },
    onCorrectStroke: function(data) {
        currentStroke++;
    },
    onMistake: function(strokeData) {
        // Play mistake sound
        soundEffects.playMistake();
    }
    })
}
async function next(delayTime, increment, done) {
    await delay(delayTime);
    
    if (exerciseSession.active) {
        // In exercise mode
        if (done) {
            completeCurrentExercise();
        } else {
            incrementOriginal(increment);
        }
    } else {
        // Normal navigation
        currentIndex += Number(increment);
        setHanzi(hanziList[currentIndex]);
    }
    
    quizOn();
}
document.getElementById("back").addEventListener("click", () => {
    if(currentIndex > 0)
        next(0, -1, false);
});
document.getElementById("next").addEventListener("click", () => {
    if(currentIndex < hanziList.length)
        next(0, 1, false);
});

// Arrow key navigation
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && currentIndex > 0) {
        next(0, -1, false);
    } else if (e.key === "ArrowRight" && currentIndex < hanziList.length) {
        next(0, 1, false);
    }
});
function skipTo() {
var input = document.getElementById("skipto").value;
console.log(input);
try {
    if(Number.isInteger(parseInt(input))) { // Go to index
    currentIndex = parseInt(input, 10);
    setHanzi(hanziList[input]);        
    }
    else {
    currentIndex = hanziList.indexOf(input);
    setHanzi(input) // Go directly to character       
    }
    quizOn();
} catch (error) {
    console.log("Invalid input to skip")
}     
}
function hint() {
    // Play hint sound
    soundEffects.playHint();
    
    writer.highlightStroke(currentStroke);
}
document.getElementById("hint").addEventListener("click", () => {
    hint();
});

// Grid toggle functionality
const gridToggle = document.getElementById("gridToggle");
const gridBox = document.getElementById("gridBox");

gridToggle.addEventListener("click", () => {
    gridBox.classList.toggle("retracted");
});

// Exercise start button
document.getElementById('startExercise').addEventListener('click', startExercise);
function setHanzi(hanzi) {
writer.setCharacter(hanzi);

// Reapply theme colors after setting character
setTimeout(updateWriterColors, 50);

if(consent == "accepted") {
    localStorage.setItem("currentIndex", currentIndex);
    if(_targetLang) {
        localStorage.setItem("targetLang", _targetLang);
    }
}

console.log(currentIndex);
var currentHanziData = hanziData[currentIndex];

switch(_targetLang) {
case "jp":
    console.log(currentHanziData);
    document.getElementById('kun').textContent = currentHanziData.wk_readings_kun;
    document.getElementById('on').textContent = currentHanziData.wk_readings_on;
    document.getElementById('meaning').textContent = currentHanziData.wk_meanings;
    document.getElementById('grade').textContent = "JLPT N" + currentHanziData.jlpt_new;
    break;
case "trad":
case "simp":
    currentHanziData = hanziData[hanzi];
    console.log(currentHanziData);
    document.getElementById('pinyin').textContent = currentHanziData.pinyin;
    document.getElementById('meaning').textContent = currentHanziData.meaning;
    document.getElementById('grade').textContent = "HSK ";
    break;
}
document.getElementById("indexInfo").textContent = currentIndex;
}

async function setLang(targetLang) {
    var orderList = null;
    var dictList = null;
    
    console.log("Loading language:", targetLang);
    _targetLang = targetLang;
    
    switch(true) {
    case targetLang == "jp":
        orderList = 'assets/lists/kanji-jouyou.json';      
        document.getElementById("jpinfo").hidden = false;
        document.getElementById("cninfo").hidden = true;
        return fetch(orderList)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${orderList}: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            hanziList = Object.keys(data);
            hanziData = Object.values(data);
            console.log("Japanese data loaded successfully");
        })
        .catch(error => {
            console.error('Failed to load char data (Japanese):', error);
            alert('Failed to load character data. Please refresh the page and try again.');
            throw error;
        });         
    
    case targetLang == "trad":
    case targetLang == "simp":
        document.getElementById("jpinfo").hidden = true;
        document.getElementById("cninfo").hidden = false;
        dictList = 'assets/lists/chinese_characters.json';
        orderList = targetLang == "simp" 
        ? 'assets/lists/simplified_chars_by_stroke.json'
        : 'assets/lists/traditional_chars_by_stroke.json';
        break;
    default:
        const errorMsg = `Language undefined: ${targetLang}`;
        console.error(errorMsg);
        alert(errorMsg);
        throw new Error(errorMsg);
    }
    
    return Promise.all([
        fetch(dictList).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${dictList}: ${response.status}`);
            }
            return response.json();
        }),
        fetch(orderList).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${orderList}: ${response.status}`);
            }
            return response.json();
        })
    ]).then(([dictData, orderData]) => {
        hanziData = dictData;
        hanziList = orderData;
        console.log("Chinese data loaded successfully");
    }).catch(error => {
        console.error('Failed to load char data (Chinese):', error);
        alert('Failed to load character data. Please refresh the page and try again.');
        throw error;
    });
}

function populateList(from, to) {
    const grid = document.getElementById("kanji-grid");

    for (let i = from; i <= to; i++) {
        const item = document.createElement("div");
        item.className = "kanji-item";
        item.textContent = hanziList[i];
        
        // Add click functionality to skip to character
        item.addEventListener("click", () => {
            currentIndex = i;
            setHanzi(hanziList[i]);
            quizOn();
        });
        
        // Add tooltip with readings
        const character = hanziList[i];
        let tooltipText = "";
        
        switch(_targetLang) {
            case "jp":
                const jpData = hanziData[i];
                if (jpData) {
                    const kun = jpData.wk_readings_kun || "";
                    const on = jpData.wk_readings_on || "";
                    tooltipText = `Kun: ${kun}${kun && on ? ", " : ""}On: ${on}`;
                }
                break;
            case "trad":
            case "simp":
                const cnData = hanziData[character];
                if (cnData && cnData.pinyin) {
                    tooltipText = `Pinyin: ${cnData.pinyin}`;
                }
                break;
        }
        
        if (tooltipText) {
            item.title = tooltipText;
        }
        
        grid.appendChild(item);
    }
}

// Exercise Session Functions
function startExercise() {
    const jlptLevel = document.getElementById('jlptLevel').value;
    const exerciseCount = parseInt(document.getElementById('exerciseCount').value);
    
    if (_targetLang !== "jp") {
        alert("Exercise sessions are currently only available for Japanese (JLPT) characters.");
        return;
    }
    
    if (!hanziData || hanziData.length === 0) {
        alert("Character data not loaded. Please wait for data to load before starting an exercise.");
        return;
    }
    
    // Filter kanji by JLPT level
    const filteredKanji = [];
    for (let i = 0; i < hanziData.length; i++) {
        const kanjiInfo = hanziData[i];
        if (kanjiInfo && kanjiInfo.jlpt_new == jlptLevel) {
            filteredKanji.push({
                character: hanziList[i],
                index: i,
                data: kanjiInfo
            });
        }
    }
    
    if (filteredKanji.length === 0) {
        alert(`No characters found for JLPT N${jlptLevel}`);
        return;
    }
    
    if (filteredKanji.length < exerciseCount) {
        alert(`Only ${filteredKanji.length} characters available for JLPT N${jlptLevel}. Adjusting count.`);
    }
    
    // Randomly select kanji for the exercise
    const shuffled = [...filteredKanji].sort(() => Math.random() - 0.5);
    const selectedKanji = shuffled.slice(0, Math.min(exerciseCount, filteredKanji.length));
    
    // Initialize exercise session
    exerciseSession.active = true;
    exerciseSession.kanjiList = selectedKanji;
    exerciseSession.currentExerciseIndex = 0;
    exerciseSession.completed = new Set();
    exerciseSession.originalIndex = currentIndex;
    exerciseSession.originalHanziList = hanziList;
    
    // Switch to the first exercise character
    currentIndex = selectedKanji[0].index;
    setHanzi(selectedKanji[0].character);
    
    populateExerciseGrid();
    updateExerciseProgress();
    
    // Update UI
    document.getElementById('startExercise').disabled = true;
    console.log(`Started exercise with ${selectedKanji.length} JLPT N${jlptLevel} characters`);
}

function populateExerciseGrid() {
    const grid = document.getElementById("exercise-grid");
    grid.innerHTML = "";
    
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
            currentIndex = kanjiInfo.index;
            setHanzi(kanjiInfo.character);
            updateExerciseGrid();
            quizOn();
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
    
    // Check if exercise is complete
    if (exerciseSession.completed.size === exerciseSession.kanjiList.length) {
        // Play session completion sound
        soundEffects.playSessionComplete();
        
        alert("Exercise completed! Great work!");
        endExercise();
        return;
    }
    
    // Move to next unfinished character
    moveToNextExerciseCharacter();
}

function moveToNextExerciseCharacter() {
    if (!exerciseSession.active) return;
    
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
        currentIndex = kanjiInfo.index;
        setHanzi(kanjiInfo.character);
        updateExerciseGrid();
    }
}

function endExercise() {
    exerciseSession.active = false;
    
    // Restore original state
    currentIndex = exerciseSession.originalIndex;
    
    // Clear exercise grid
    document.getElementById("exercise-grid").innerHTML = "";
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0/0';
    
    // Re-enable start button
    document.getElementById('startExercise').disabled = false;
    
    // Set back to original character
    setHanzi(hanziList[currentIndex]);
}

// Modified navigation functions to work with exercise
function incrementOriginal(increment) {
    if (exerciseSession.active) {
        // In exercise mode, navigate within exercise
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
                currentIndex = kanjiInfo.index;
                setHanzi(kanjiInfo.character);
                updateExerciseGrid();
            }
        }
        return;
    }
    
    // Original navigation logic
    currentIndex += Number(increment);
    setHanzi(hanziList[currentIndex]);
}