// --- DOM ELEMENTS ---
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const loader = document.getElementById('loader');

// Welcome/Home Page Elements
const welcomeContainer = document.getElementById('welcome-container');
const nameInput = document.getElementById('name-input');
const startBtn = document.getElementById('start-btn');

// Quiz Page Elements
const quizContainer = document.getElementById('quiz-container');
const questionCounterEl = document.getElementById('question-counter');
const scoreCounterEl = document.getElementById('score-counter');
const questionEl = document.getElementById('question');
const answerButtonsEl = document.getElementById('answer-buttons');
const timerLine = document.getElementById('timer-line');

// Results Page Elements
const resultsContainer = document.getElementById('results-container');
const resultsNameEl = document.getElementById('results-name');
const finalScoreEl = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');

// Leaderboard Page Elements
const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');

// --- STATE ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userName = '';
const QUIZ_LENGTH = 50;
const TIME_PER_QUESTION = 15;
let timer;

// --- INITIALIZATION ---
window.onload = () => {
    setupNavigation();
    const savedName = localStorage.getItem('triviaUserName');
    if (savedName) {
        userName = savedName;
        welcomeContainer.innerHTML = `<h1>Welcome back, ${userName}!</h1><p>Ready for a new challenge?</p><button id="start-btn">Start New Quiz</button>`;
    }
    document.getElementById('start-btn').addEventListener('click', handleStart);
};

// --- NAVIGATION ---
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');

            pages.forEach(page => page.classList.add('hidden'));
            document.getElementById(`${pageId}-page`).classList.remove('hidden');

            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            if (pageId === 'leaderboard') {
                displayLeaderboard();
            }
        });
    });
}

function handleStart() {
    userName = nameInput.value?.trim() || userName;
    if (userName) {
        localStorage.setItem('triviaUserName', userName);
        startQuiz();
    } else {
        alert('Please enter your name!');
    }
}

// --- QUIZ LOGIC ---
async function startQuiz() {
    welcomeContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    loader.classList.remove('hidden');

    await fetchQuestions();

    loader.classList.add('hidden');
    quizContainer.classList.remove('hidden');

    currentQuestionIndex = 0;
    score = 0;
    updateScoreDisplay();
    loadNextQuestion();
}

async function fetchQuestions() {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=${QUIZ_LENGTH}&type=multiple`);
        const data = await response.json();
        questions = data.results.map(q => ({
            question: q.question,
            answers: shuffleArray([...q.incorrect_answers, q.correct_answer]),
            correctAnswer: q.correct_answer
        }));
    } catch (error) {
        console.error("Failed to fetch questions:", error);
        alert("Sorry, we couldn't load the questions. Please try again later.");
        showPage('home'); // Go back to home on error
    }
}

function loadNextQuestion() {
    resetState();
    if (currentQuestionIndex < questions.length) {
        showQuestion(questions[currentQuestionIndex]);
        startTimer();
    } else {
        showResults();
    }
}

function showQuestion(questionData) {
    questionCounterEl.innerText = `Question ${currentQuestionIndex + 1}/${QUIZ_LENGTH}`;
    questionEl.innerHTML = questionData.question;
    questionData.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerHTML = answer;
        button.classList.add('btn');
        button.addEventListener('click', selectAnswer);
        answerButtonsEl.appendChild(button);
    });
}

function selectAnswer(e) {
    clearTimeout(timer);
    const selectedButton = e.target;
    const correct = selectedButton.innerHTML === questions[currentQuestionIndex].correctAnswer;

    if (correct) {
        score++;
        updateScoreDisplay();
    }
    
    Array.from(answerButtonsEl.children).forEach(button => {
        setStatusClass(button, button.innerHTML === questions[currentQuestionIndex].correctAnswer);
        button.disabled = true;
    });

    setTimeout(() => {
        currentQuestionIndex++;
        loadNextQuestion();
    }, 1500);
}

// --- RESULTS & LEADERBOARD ---
function showResults() {
    quizContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsNameEl.innerText = `Well done, ${userName}!`;
    finalScoreEl.innerText = `${score} / ${QUIZ_LENGTH}`;
    saveScore();
    playAgainBtn.addEventListener('click', () => {
        resultsContainer.classList.add('hidden');
        welcomeContainer.classList.remove('hidden');
    });
}

function saveScore() {
    const scores = JSON.parse(localStorage.getItem('triviaScores')) || [];
    scores.push({ name: userName, score: score });
    scores.sort((a, b) => b.score - a.score); // Sort descending
    scores.splice(10); // Keep only top 10
    localStorage.setItem('triviaScores', JSON.stringify(scores));
}

function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('triviaScores')) || [];
    leaderboardTableBody.innerHTML = ''; // Clear previous entries
    if (scores.length === 0) {
        leaderboardTableBody.innerHTML = '<tr><td colspan="3">No scores yet. Play a game!</td></tr>';
        return;
    }
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.name}</td>
            <td>${score.score}</td>
        `;
        leaderboardTableBody.appendChild(row);
    });
}

// --- TIMER ---
function startTimer() {
    timerLine.style.transition = 'none';
    timerLine.style.width = '100%';
    setTimeout(() => {
        timerLine.style.transition = `width ${TIME_PER_QUESTION}s linear`;
        timerLine.style.width = '0%';
    }, 10);
    timer = setTimeout(() => {
        currentQuestionIndex++;
        loadNextQuestion();
    }, TIME_PER_QUESTION * 1000);
}

// --- UTILITIES ---
function resetState() {
    clearTimeout(timer);
    while (answerButtonsEl.firstChild) {
        answerButtonsEl.removeChild(answerButtonsEl.firstChild);
    }
}

function updateScoreDisplay() {
    scoreCounterEl.innerText = `Score: ${score}`;
}

function setStatusClass(element, correct) {
    element.classList.add(correct ? 'correct' : 'wrong');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
