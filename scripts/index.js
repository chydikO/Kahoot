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
    all: [...DEMO_QUESTIONS],
    pool: [],
    current: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    secondsPerQ: 30,
    timeLeft: 30,
    timer: null,
    accepting: false,
    details: [] // per-question breakdown
};

// ======= Helpers =======
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const show = id => { $$('#screen-lobby, #screen-quiz, #screen-results').forEach(el=>el.classList.remove('active')); $(id).classList.add('active'); };
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1800); };
const shuffle = (arr) => arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]);

function setProgress(){
    const pct = (state.current / state.pool.length) * 100;
    $('#progress').style.width = pct + '%';
}

function updateIndicators(){
    $('#score').textContent = state.score;
    $('#scoreLive').textContent = state.score;
    $('#streak').textContent = state.streak;
    $('#qIndicator').textContent = `Питання ${Math.min(state.current+1,state.pool.length)}/${state.pool.length}`;
}

// Timer ring update
const CIRC = 2 * Math.PI * 22; // stroke length
function setRing(){
    const dash = CIRC * (1 - state.timeLeft / state.secondsPerQ);
    document.querySelector('.bar').setAttribute('stroke-dasharray', CIRC.toFixed(2));
    document.querySelector('.bar').setAttribute('stroke-dashoffset', dash.toFixed(2));
    $('#timeLeft').textContent = Math.max(0, Math.ceil(state.timeLeft));
}

function stopTimer(){ clearInterval(state.timer); state.timer = null; }
function startTimer(){
    stopTimer();
    state.timeLeft = state.secondsPerQ;
    setRing();
    state.timer = setInterval(()=>{
        state.timeLeft -= 0.1;
        setRing();
        if(state.timeLeft <= 0){
            stopTimer();
            lockQuestion();
        }
    }, 100);
}

function lockQuestion(){
    state.accepting = false;
    $('#next').disabled = false;
    // mark correct option visually if unanswered
    const correctIdx = state.pool[state.current].answer;
    $$('#options .opt').forEach((opt,i)=>{
        if(!opt.classList.contains('correct') && !opt.classList.contains('wrong')){
            if(i===correctIdx) opt.classList.add('correct');
        }
    })
}

function renderQuestion(){
    const q = state.pool[state.current];
    $('#question').textContent = q.q;
    const letters = ['A','B','C','D'];
    const wrap = $('#options');
    wrap.innerHTML = '';
    q.options.forEach((text,i)=>{
        const div = document.createElement('label');
        div.className = 'opt';
        div.innerHTML = `<input type="radio" name="opt"><div class="marker"><span>${letters[i]}</span></div><div>${text}</div>`;
        div.addEventListener('click',()=> selectAnswer(i));
        wrap.appendChild(div);
    });

    $('#next').disabled = true;
    state.accepting = true;
    startTimer();
    setProgress();
    updateIndicators();
}

function selectAnswer(i){
    if(!state.accepting) return;
    const q = state.pool[state.current];
    const correct = i === q.answer;
    const opts = $$('#options .opt');
    opts.forEach((el,idx)=>{
        el.classList.remove('correct','wrong');
        if(idx===q.answer) el.classList.add('correct');
    });
    if(!correct){ opts[i].classList.add('wrong'); }

    stopTimer();
    state.accepting = false;
    $('#next').disabled = false;

    // scoring
    let gained = 0;
    if(correct){
        const timeBonus = Math.round(500 * (state.timeLeft / state.secondsPerQ));
        state.streak += 1; state.bestStreak = Math.max(state.bestStreak, state.streak);
        gained = 1000 + timeBonus + (state.streak-1)*100;
        state.score += gained;
        toast(`+${gained} очок!`);
    } else {
        state.streak = 0; // miss breaks streak
        toast('Невірно');
    }

    // save detail
    state.details[state.current] = {
        index: state.current+1,
        q: q.q,
        picked: i,
        correct: q.answer,
        gained: gained,
        status: correct? '✅ Вірно':'❌ Помилка'
    };
    updateIndicators();
}

function nextQuestion(){
    if(state.current < state.pool.length - 1){
        state.current++;
        renderQuestion();
    } else {
        // results
        show('#screen-results');
        $('#finalScore').textContent = state.score;
        $('#bestStreak').textContent = state.bestStreak;
        const tbody = $('#details');
        tbody.innerHTML = state.details.map(d=>`
        <tr>
          <td>${d.index}</td>
          <td>${d.q}</td>
          <td>${['A','B','C','D'][d.picked] ?? '—'} / правильна: ${['A','B','C','D'][d.correct]}</td>
          <td>${d.status}</td>
          <td>${d.gained}</td>
        </tr>
      `).join('');
    }
}

function startGame(){
    const cnt = parseInt($('#q-count').value,10);
    state.secondsPerQ = parseInt($('#q-seconds').value,10);
    state.pool = shuffle(state.all).slice(0, cnt);
    state.current = 0; state.score = 0; state.streak = 0; state.bestStreak = 0; state.details = [];
    show('#screen-quiz');
    renderQuestion();
}

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
$('#next').addEventListener('click', nextQuestion);
$('#skip').addEventListener('click', ()=>{ lockQuestion(); nextQuestion(); });
$('#again').addEventListener('click', ()=>{ resetAll(); startGame(); });
$('#returnLobby').addEventListener('click', resetAll);
$('#importBtn').addEventListener('click', promptImport);
$('#resetBtn').addEventListener('click', ()=>{ state.all=[...DEMO_QUESTIONS]; toast('Скинуто до дефолту'); });

// Hotkeys 1-4
window.addEventListener('keydown', (e)=>{
    if(['1','2','3','4'].includes(e.key) && state.accepting){ selectAnswer(parseInt(e.key,10)-1); }
    if(e.key==='Enter' && !$('#next').disabled){ nextQuestion(); }
});

// Init lobby PIN
function genPin(){ return Math.floor(100000 + Math.random()*900000); }
$('#pin').textContent = genPin();