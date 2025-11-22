// ======= Data (demo) =======
const DEMO_QUESTIONS = [
    { q: 'Яка мова виконується у браузері?', options: ['Python','C++','JavaScript','Java'], answer: 2 },
    { q: 'Селектор за ідентифікатором у CSS?', options: ['.id','#id','id{}','[id]'], answer: 1 },
    { q: 'Що таке DOM?', options: ['Фреймворк','База даних','Модель об’єктів документа','Протокол'], answer: 2 },
    { q: 'Метод масиву, що повертає новий масив такої ж довжини', options: ['forEach','map','reduce','filter'], answer: 1 },
    { q: 'HTTP-метод для отримання даних', options: ['PUT','POST','GET','PATCH'], answer: 2 },
    { q: 'Оголошення змінної, яку не змінюють', options: ['let','const','var','static'], answer: 1 },
    { q: 'Подія кліку миші в JS', options: ['tap','press','mouse','click'], answer: 3 },
    { q: 'Властивість CSS для гнучкого контейнера', options: ['display:flex','flex:container','position:flex','float:flex'], answer: 0 },
    { q: 'Якою командою ініціалізувати Git репозиторій?', options: ['git new','git init','git start','git create'], answer: 1 },
    { q: 'Оператор суворого порівняння', options: ['==','!=','===','=<'], answer: 2 },
    { q: 'Метод перетворення рядка у число', options: ['parseInt','join','split','slice'], answer: 0 },
    { q: 'JSON — це…', options: ['Мова програмування','Формат даних','БД','ОС'], answer: 1 },
    { q: 'CSS змінні задаються через', options: ['$var','--var','@@var','##var'], answer: 1 },
    { q: 'Колекція ключ-значення у JS', options: ['Array','Map','Set','String'], answer: 1 },
    { q: 'Функція, що викликається пізніше', options: ['callback','payload','promise','getter'], answer: 0 },
    { q: 'Метод для додавання в кінець масиву', options: ['shift','push','pop','unshift'], answer: 1 },
    { q: 'Метод, що повертає перший елемент за умовою', options: ['find','some','every','includes'], answer: 0 },
    { q: 'Одиниця, відносна до розміру шрифту', options: ['px','cm','em','vh'], answer: 2 },
    { q: 'Яке значення position фіксує відносно вікна?', options: ['relative','fixed','static','sticky'], answer: 1 },
    { q: 'Math.random() повертає…', options: ['випадкове число [0,1)','округлене число','максимум із масиву','квадратний корінь'], answer: 0 },
    { q: 'Атрибут <img> для альтернативного тексту', options: ['title','name','alt','desc'], answer: 2 }
];

// ======= State =======
const state = {
    all: [...DEMO_QUESTIONS], // Всі доступні питання (може змінюватися імпортом)
    pool: [],                // Питання, відібрані для поточної гри
    current: 0,              // Індекс поточного питання у масиві 'pool'
    score: 0,                // Загальний рахунок гравця
    streak: 0,               // Кількість правильних відповідей поспіль
    bestStreak: 0,           // Найкраща серія правильних відповідей
    secondsPerQ: 20,         // Ліміт часу на одне питання
    timeLeft: 20,            // Час, що залишився у поточному питанні
    timer: null,             // ID таймера (для очищення за допомогою clearInterval)
    accepting: false,        // Прапорець: чи приймаються відповіді зараз (true/false)
    results: [],              // Масив для зберігання детальних результатів по кожному питанню
    selectedAnswer: null     // Індекс останньої обраної відповіді (null, 0, 1, 2, або 3)
};

// ======= Helpers functions=======
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Функція яка Показує потрібний екран.
const show = id => {
    $$('#screen-lobby, #screen-quiz, #screen-results').forEach(el=>el.classList.remove('active')); $(id).classList.add('active');
};

//Функція яка Виводить повідомлення на екран на короткий час.
const toast = (msg) => {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1800);
};

// Функція яка Перемішує масив (Fisher-Yates shuffle)
const shuffle = (arr) => arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);

//Функція яка Оновлює індикатор прогресу.
function setProgress(){
    const pct = (state.current / state.pool.length) * 100;
    $('#progress').style.width = pct + '%';
}

// Функція яка Оновлює індикатори (рахунок, серія, номер питання)
function updateIndicators(){
    $('#score').textContent = state.score;
    $('#scoreLive').textContent = state.score;
    $('#streak').textContent = state.streak;
    $('#qIndicator').textContent = `Питання ${Math.min(state.current+1,state.pool.length)}/${state.pool.length}`;
}

// ======= Quiz functions =======
const CIRC = 2 * Math.PI * 22; // stroke length

// Функція яка Оновлює кільце таймера.
function setRing(){
    const dash = CIRC * (1 - state.timeLeft / state.secondsPerQ);
    document.querySelector('.bar').setAttribute('stroke-dasharray', CIRC.toFixed(2));
    document.querySelector('.bar').setAttribute('stroke-dashoffset', dash.toFixed(2));
    $('#timeLeft').textContent = Math.max(0, Math.ceil(state.timeLeft));
}

// Функція яка Зупиняє таймер.
function stopTimer(){
    clearInterval(state.timer);
    state.timer = null;
}

// Функція яка Запускає таймер (оновлено).
function startTimer(){
    stopTimer();
    state.timeLeft = state.secondsPerQ;
    // Скидаємо selectedAnswer перед початком нового питання
    state.selectedAnswer = null;
    setRing();
    state.timer = setInterval(()=>{
        state.timeLeft -= 0.1;
        setRing();
        if(state.timeLeft <= 0){
            // Викликаємо lockQuestion, коли час вийшов
            lockQuestion(); // нарахуванням балів

            setTimeout(()=>{
                if($('#screen-quiz').classList.contains('active')){
                    nextQuestion();
                }
            }, 2000);
        }
    }, 100);
}

// Функція яка Фіналізує питання (блокує відповіді та нараховує очки).
function lockQuestion(){
    stopTimer(); // Зупиняємо таймер
    state.accepting = false;
    $('#next').disabled = false;

    // >>> ДОДАНО: Блокуємо кнопку "Пропустити"
    $('#skip').disabled = true;

    const q = state.pool[state.current];
    const correctIdx = q.answer;
    const pickedIdx = state.selectedAnswer; // Використовуємо останню обрану відповідь

    // Нарахування балів (переміщено сюди)
    let gained = 0;
    const correct = pickedIdx === correctIdx;

    if(correct){
        // Обчислення балів (як було раніше)
        const timeBonus = Math.round(500 * (state.timeLeft / state.secondsPerQ));
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        gained = 1000 + timeBonus + (state.streak-1)*100;
        state.score += gained;
        toast(`+${gained} очок!`);
    } else {
        state.streak = 0; // miss breaks streak
        if(pickedIdx !== null) { // Якщо була обрана відповідь
            toast('Невірно');
        } else {
            toast('Час вийшов!');
        }
    }

    // save detail
    state.results[state.current] = {
        index: state.current+1,
        q: q.q,
        picked: pickedIdx,
        correct: correctIdx,
        gained: gained,
        status: correct ? '✅ Вірно' : (pickedIdx === null ? '⏳ Час вийшов' : '❌ Помилка')
    };
    updateIndicators();

    // Візуальне відображення результатів
    $$('#options .opt').forEach((opt,i)=>{
        // Додаємо класи correct/wrong
        if(i === correctIdx) {
            opt.classList.add('correct');
        } else if (i === pickedIdx) {
            opt.classList.add('wrong');
        }

        // >>> ДОДАНО: Прибираємо підсвічування "обрано"
        opt.classList.remove('selected-pick');

        // Блокуємо всі кнопки, щоб не було кліків
        opt.style.pointerEvents = 'none';
    });
}

// Функція яка Відображає поточне питання та варіанти відповідей (оновлено).
function renderQuestion(){
    const q = state.pool[state.current];
    $('#question').textContent = q.q;
    const letters = ['A','B','C','D'];

    const wrap = $('#options');
    wrap.innerHTML = '';

    // >>> Викликаємо функцію, яка створює варіант
    const createOption = (text, i) => {
        const div = document.createElement('label');
        div.className = 'opt';
        div.innerHTML = `<input type="radio" name="opt" value="${i}"><div class="marker"><span>${letters[i]}</span></div><div>${text}</div>`;
        // >>> Тепер selectAnswer просто реєструє вибір і підсвічує його
        div.addEventListener('click',()=> selectAnswer(i));
        wrap.appendChild(div);
    };

    q.options.forEach(createOption);
    $('#next').disabled = true;
    $('#skip').disabled = false;
    $('#skip').textContent = "Пропустити";
    $('#next').textContent = "Далі";

    state.accepting = true;
    startTimer();
    setProgress();
    updateIndicators();
}


// Функція яка Обробляє вибір відповіді користувачем (оновлено).
function selectAnswer(i){
    if(!state.accepting) return; // якщо відповіді не приймаються, вихід

    // 1. Реєструємо вибір
    state.selectedAnswer = i;

    // 2. Візуально підсвічуємо обраний варіант
    const opts = $$('#options .opt');

    opts.forEach((el,idx)=>{
        el.classList.remove('selected-pick'); // Скидаємо попередній вибір
        // Створюємо новий CSS-клас 'selected-pick' для візуального підсвічування
        if(idx === i) {
            el.classList.add('selected-pick');
        }
        // Переконуємось, що правильна/неправильна відповідь поки не відображається
        el.classList.remove('correct','wrong');
    });

    // 3. Активуємо кнопку "Далі" для пропуску, якщо відповідь обрана
    $('#skip').textContent = "Пропустити"; // Кнопка "Пропустити" залишається

    $('#next').disabled = false;
    $('#next').textContent = "Далі (Enter)";
}

// Функція яка Відображає результати гри.
function showResult() {
    show('#screen-results');
    $('#finalScore').textContent = state.score;
    $('#bestStreak').textContent = state.bestStreak;

    // use the real id of your tbody here (e.g. #details instead of #results)
    const tbody = document.querySelector('#details'); // <-- adjust if needed
    if (!tbody) {
        console.warn('Results tbody element not found');
        return;
    }

    tbody.innerHTML = state.results.map(d => `
            <tr>
                <td>${d.index}</td>
                <td>${d.q}</td>
                <td>${['A', 'B', 'C', 'D'][d.picked] ?? '—'} / правильна: ${['A', 'B', 'C', 'D'][d.correct]}</td>
                <td>${d.status}</td>
                <td>${d.gained}</td>
            </tr>
        `).join('');
}

// Функція яка Переходить до наступного питання або показує результати.
function nextQuestion(){
    if(state.current < state.pool.length - 1){
        state.current++;
        renderQuestion();
    } else {
        // results
        showResult();
    }
}

// Функція яка Починає нову гру.
function startGame(){
    const cnt = 5;
    state.secondsPerQ = 20;
    state.pool = shuffle(state.all).slice(0, cnt);
    state.current = 0;
    state.score = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.results = [];
    show('#screen-quiz');
    renderQuestion();
}

// Функція яка Скидає стан гри до початкового.
function resetAll(){
    stopTimer();
    show('#screen-lobby');
    $('#progress').style.width = '0%';
    $('#score').textContent = '0';
    $('#streak').textContent = '0';
}

// ======= Import =======
function promptImport(){
    const sample = '[\n  {\n    "q": "Приклад питання?",\n    "options": ["A","B","C","D"],\n    "answer": 0\n  }\n]';
    const json = prompt('Вставте JSON масив питань (q, options[4], answer index):', sample);
    if(!json) return;
    try{
        const data = JSON.parse(json);
        if(!Array.isArray(data)) throw new Error('Очікується масив');
        const ok = data.every(x=> x && typeof x.q==='string' && Array.isArray(x.options) && x.options.length===4 && Number.isInteger(x.answer));
        if(!ok) throw new Error('Невірний формат полів');
        state.all = data;
        toast(`Імпортовано питань: ${state.all.length}`);
    }catch(e){
        alert('Помилка імпорту: ' + e.message);
    }
}

// ======= Events =======
$('#start').addEventListener('click', startGame);
$('#next').addEventListener('click', () => {
    // Якщо питання вже заблоковано (після закінчення часу), просто переходимо далі
    if (!state.accepting) {
        nextQuestion();
    } else {
        // Якщо відповіді ще приймаються, це означає, що користувач обрав відповідь і натиснув "Далі"
        // Ми повинні спочатку заблокувати питання (фіналізувати вибір/рахунок)
        lockQuestion();
        // А потім перейти до наступного питання
        setTimeout(nextQuestion, 1500); // невелика затримка для візуалізації результату
    }
});

$('#skip').addEventListener('click', ()=> { lockQuestion(); nextQuestion(); });
$('#again').addEventListener('click', ()=> { resetAll(); startGame(); });
$('#returnLobby').addEventListener('click', resetAll);
$('#importBtn').addEventListener('click', promptImport);
$('#resetBtn').addEventListener('click', ()=> { state.all=[...DEMO_QUESTIONS]; toast('Скинуто до дефолту'); });

// Hotkeys 1-4
window.addEventListener('keydown', (e)=> {
    if(['1','2','3','4'].includes(e.key) && state.accepting) {
        selectAnswer(parseInt(e.key,10)-1);
    }
    if(e.key==='Enter' && !$('#next').disabled) {
        nextQuestion();
    }
});

//startGame();

// Init lobby PIN
function genPin(){
    return Math.floor(100000 + Math.random()*900000);
}

$('#pin').textContent = genPin();