import { SoundEffects } from './sound-effects.js';
import { 
    exerciseSession, 
    initializeExercisePanel, 
    startExercise, 
    endExercise, 
    completeCurrentExercise, 
    handleExerciseNavigation 
} from './exercise-session.js';

const consent = localStorage.getItem("cookieConsent");
if(consent == "accepted" && localStorage.getItem("currentIndex")) {
    currentIndex = parseInt(localStorage.getItem("currentIndex"), 10);
}
if(consent == "accepted" && localStorage.getItem("targetLang")) {
    _targetLang = localStorage.getItem("targetLang");
}

var currentStroke = 0;
var currentIndex = 0; 

var hanziList = null;
var hanziData = null;

var _targetLang = null;

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
    // Update grade dropdown after language is loaded
    updateGradeDropdown();
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

setHanzi(hanziList[currentIndex]);

writer.showOutline();
quizOn()

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
            // Use the exercise navigation handler
            if (!handleExerciseNavigation(increment)) {
                // Fall back to normal navigation if not in exercise
                currentIndex += Number(increment);
                setHanzi(hanziList[currentIndex]);
            }
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

// Try to initialize exercise panel immediately, or wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExercisePanel);
} else {
    initializeExercisePanel();
}
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

// Check if hanziData is loaded before accessing it
if (!hanziData || hanziData.length === 0) {
    console.warn('hanziData not loaded yet, skipping description update');
    document.getElementById("indexInfo").textContent = currentIndex;
    return;
}

var currentHanziData = hanziData[currentIndex];

switch(_targetLang) {
case "jp":
    // Check if currentHanziData exists for Japanese
    if (!currentHanziData) {
        console.warn(`No data found for kanji at index: ${currentIndex}`);
        document.getElementById('kun').textContent = '';
        document.getElementById('on').textContent = '';
        document.getElementById('meaning').textContent = '';
        document.getElementById('grade').textContent = 'JLPT N';
    } else {
        console.log(currentHanziData);
        document.getElementById('kun').textContent = currentHanziData.wk_readings_kun || '';
        document.getElementById('on').textContent = currentHanziData.wk_readings_on || '';
        document.getElementById('meaning').textContent = currentHanziData.wk_meanings || '';
        document.getElementById('grade').textContent = "JLPT N" + (currentHanziData.jlpt_new || '');
    }
    
    // Show Japanese dictionaries and hide Chinese ones
    document.getElementById('japanese-dictionaries').style.display = 'inline';
    document.getElementById('chinese-dictionaries').style.display = 'none';
    
    // Update dictionary links for Japanese
    const currentKanji = hanziList[currentIndex];
    if (currentKanji) {
        document.getElementById('jisho-link').href = `https://jisho.org/search/${encodeURIComponent(currentKanji)}`;
        document.getElementById('jpdb-link').href = `https://jpdb.io/search?q=${encodeURIComponent(currentKanji)}`;
    }
    break;
case "trad":
case "simp":
    // For Chinese, hanziData is keyed by character, not index
    currentHanziData = hanziData[hanzi];
    if (!currentHanziData) {
        console.warn(`No data found for character: ${hanzi}`);
        document.getElementById('pinyin').textContent = '';
        document.getElementById('meaning').textContent = '';
        document.getElementById('grade').textContent = 'HSK ';
    } else {
        console.log(currentHanziData);
        document.getElementById('pinyin').textContent = currentHanziData.pinyin || '';
        document.getElementById('meaning').textContent = currentHanziData.meaning || '';
        document.getElementById('grade').textContent = "HSK " + (currentHanziData.hsk || '');
    }
    
    // Show Chinese dictionaries and hide Japanese ones
    document.getElementById('chinese-dictionaries').style.display = 'inline';
    document.getElementById('japanese-dictionaries').style.display = 'none';
    
    // Update dictionary links for Chinese
    const currentHanzi = hanzi;
    if (currentHanzi) {
        document.getElementById('mdbg-link').href = `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(currentHanzi)}`;
        document.getElementById('naver-link').href = `https://dict.naver.com/linedict/zhendict/dict.html#/cnen/search?query=${encodeURIComponent(currentHanzi)}`;
    }
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

// Make functions globally accessible for settings
window.setLang = setLang;
window.exerciseSession = exerciseSession;
window.endExercise = endExercise;
window.populateList = populateList;
window.setHanzi = setHanzi;
window.updateGradeDropdown = updateGradeDropdown;
window.hanziList = null;
window.currentIndex = 0;
window._targetLang = null;

// Helper functions for module communication
window.getMainData = function() {
    return {
        hanziData,
        hanziList,
        _targetLang,
        currentIndex,
        setHanzi,
        startQuiz,
        quizOn
    };
};

window.getSoundEffects = function() {
    return soundEffects;
};

window.updateCurrentIndex = function(newIndex) {
    currentIndex = newIndex;
};

// Update global references when they change
setInterval(() => {
    window.hanziList = hanziList;
    window.currentIndex = currentIndex;
    window._targetLang = _targetLang;
}, 100);

// Update currentIndex when it changes globally
setInterval(() => {
    if (window.currentIndex !== undefined && window.currentIndex !== currentIndex) {
        currentIndex = window.currentIndex;
    }
}, 100);

// Function to update grade dropdown based on language
function updateGradeDropdown() {
    const gradeSelect = document.getElementById('gradeLevel');
    if (!gradeSelect) return;
    
    const currentValue = gradeSelect.value;
    gradeSelect.innerHTML = '';
    
    switch(_targetLang) {
        case 'jp':
            // JLPT levels (N5 to N1)
            gradeSelect.innerHTML = `
                <option value="5">JLPT N5</option>
                <option value="4">JLPT N4</option>
                <option value="3">JLPT N3</option>
                <option value="2">JLPT N2</option>
                <option value="1">JLPT N1</option>
            `;
            break;
            
        case 'trad':
        case 'simp':
            // HSK levels (1 to 6)
            gradeSelect.innerHTML = `
                <option value="1">HSK 1</option>
                <option value="2">HSK 2</option>
                <option value="3">HSK 3</option>
                <option value="4">HSK 4</option>
                <option value="5">HSK 5</option>
                <option value="6">HSK 6</option>
            `;
            break;
            
        default:
            gradeSelect.innerHTML = '<option value="">No grades available</option>';
    }
    
    // Try to maintain the same value if it exists in the new options
    const options = Array.from(gradeSelect.options).map(opt => opt.value);
    gradeSelect.value = options.includes(currentValue) ? currentValue : gradeSelect.firstElementChild?.value || '';
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