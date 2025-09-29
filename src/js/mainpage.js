const consent = localStorage.getItem("cookieConsent");
if(consent == "accepted" && localStorage.getItem("currentIndex"))
currentIndex = localStorage.getItem("currentIndex");

var radicalColored = false;
var currentStroke = 0;
var currentIndex = 0; 

var hanziList = null;
var hanziData = null;

var _targetLang = null;

const targetWidth = 300;
const targetHeight = 300;

const svg = document.getElementById('grid-background-target');
svg.setAttribute('width', targetWidth);
svg.setAttribute('height', targetHeight);

const target = document.getElementById('target');
target.width = targetWidth;
target.height = targetHeight;

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

//coming from index page
const urlParams = new URLSearchParams(window.location.search);
await setLang(urlParams.get('lang'));
startQuiz();

async function startQuiz() {
target.style.display = 'block';

//if(consent == "accepted" && localStorage.getItem("currentIndex"))
//  currentIndex = localStorage.getItem("currentIndex");

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
}

function delay(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

function quizOn() {
currentStroke = 0;
writer.quiz({
    onComplete: function() {
        if(radicalColored)
        writer.updateColor('radicalColor', '#D00')

        next(2000,1,true)
    },
    onCorrectStroke: function(data) {
        currentStroke++;
    }
    })
}
async function next(delayTime, increment, done) {
await delay(delayTime);
currentIndex += Number(increment);
setHanzi(hanziList[currentIndex]);
quizOn();
}
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
writer.highlightStroke(currentStroke);
}
function setHanzi(hanzi) {
writer.setCharacter(hanzi);
if(consent == "accepted")
    localStorage.setItem("currentIndex", currentIndex);

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

function setLang(targetLang) {
    var orderList = null;
    var dictList = null;
    
    _targetLang = targetLang;
    
    switch(true) {
    case targetLang == "jp":
        orderList = 'assets/lists/kanji-jouyou.json';      
        document.getElementById("jpinfo").hidden = false;
        document.getElementById("cninfo").hidden = true;
        return fetch(orderList)
        .then(response => response.json())
        .then(data => {
        hanziList = Object.keys(data);
        hanziData = Object.values(data);
        })
        .catch(error => console.error('Error:', error));         
    
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
        throw new Error("Language undefined");
    }
    
    return Promise.all([
        fetch(dictList).then(response => response.json()),
        fetch(orderList).then(response => response.json())
    ]).then(([dictData, orderData]) => {
        hanziData = dictData;
        hanziList = orderData;
    }).catch(error => console.error('Error:', error));
}