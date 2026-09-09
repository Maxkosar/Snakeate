const storageKey = 'snakete-snacks';
const goalKey = 'snakete-goal';
const today = new Date();
const dayKey = (offset) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const defaultSnacks = [
  { name: 'Yogur con fruta', calories: 160, time: '10:30', category: 'Fruta', date: dayKey(0) },
  { name: 'Galletas de avena', calories: 120, time: '16:45', category: 'Dulce', date: dayKey(0) },
  { name: 'Manzana y almendras', calories: 180, time: '11:20', category: 'Fruta', date: dayKey(-1) },
  { name: 'Tostada con hummus', calories: 210, time: '17:10', category: 'Salado', date: dayKey(-2) }
];
let snacks = JSON.parse(localStorage.getItem(storageKey) || 'null') || defaultSnacks;
let weeklyGoal = Number(localStorage.getItem(goalKey) || 21);
let selectedCategory = 'Dulce';
let selectedDate = new Date(today);

const $ = (selector) => document.querySelector(selector);
const formatDate = (date) => date.toISOString().slice(0, 10);
const categorySymbol = { Dulce: '◒', Salado: '◈', Fruta: '◉', Bebida: '◌' };

function save() { localStorage.setItem(storageKey, JSON.stringify(snacks)); localStorage.setItem(goalKey, weeklyGoal); }
function getWeekDates() { return Array.from({ length: 7 }, (_, index) => { const date = new Date(selectedDate); date.setDate(date.getDate() - 6 + index); return date; }); }
function getWeekSnacks() { const dates = getWeekDates().map(formatDate); return snacks.filter((snack) => dates.includes(snack.date)); }

function renderDate() {
  const formatted = selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  $('#current-date').textContent = formatDate(selectedDate) === formatDate(today) ? `Hoy, ${formatted}` : formatted;
}

function renderSummary() {
  const dateSnacks = snacks.filter((snack) => snack.date === formatDate(selectedDate));
  const weekSnacks = getWeekSnacks();
  const weekDates = getWeekDates();
  const calories = dateSnacks.reduce((total, snack) => total + Number(snack.calories), 0);
  const count = dateSnacks.length;
  const percentage = Math.min(100, Math.round((count / 3) * 100));
  const goalPercentage = Math.min(100, Math.round((weekSnacks.length / weeklyGoal) * 100));
  $('#today-count').innerHTML = `${count} <small>/ 3</small>`;
  $('#today-calories').innerHTML = `${calories} <small>kcal</small>`;
  $('#today-progress').style.width = `${percentage}%`;
  $('#remaining-count').textContent = Math.max(0, 3 - count);
  $('#week-count').innerHTML = `${weekSnacks.length} <small>/ ${weeklyGoal}</small>`;
  $('#goal-percent').textContent = `${goalPercentage}%`;
  $('#goal-copy-count').textContent = `${weekSnacks.length} snacks`;
  $('#goal-used').textContent = weekSnacks.length;
  $('#goal-left').textContent = Math.max(0, weeklyGoal - weekSnacks.length);
  $('#goal-average').textContent = (weekSnacks.length / 7).toFixed(1);
  $('#goal-ring').style.background = `conic-gradient(var(--green) 0 ${goalPercentage}%, #e9eee8 ${goalPercentage}% 100%)`;
  const formatPeriodDate = (date) => date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  $('#goal-period').textContent = `Semana del ${formatPeriodDate(weekDates[0])} al ${formatPeriodDate(weekDates[6])}`;
}

function renderChart() {
  const chart = $('#weekly-chart');
  chart.innerHTML = '';
  const days = getWeekDates();
  const counts = days.map((day) => snacks.filter((snack) => snack.date === formatDate(day)).length);
  const max = Math.max(4, ...counts);
  days.forEach((day, index) => {
    const isToday = formatDate(day) === formatDate(selectedDate);
    const column = document.createElement('div');
    column.className = 'chart-column';
    column.innerHTML = `<div class="bar-wrap"><div class="bar-meta"></div><div class="chart-bar ${isToday ? 'today' : ''}" style="height:${Math.max(8, (counts[index] / max) * 64)}px">${counts[index] ? `<span class="chart-value">${counts[index]}</span>` : ''}</div></div><span class="chart-label ${isToday ? 'today' : ''}">${day.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span>`;
    chart.appendChild(column);
  });
}

function renderList() {
  const list = $('#snack-list');
  const recent = [...snacks].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0, 4);
  list.innerHTML = recent.map((snack) => `<div class="snack-row"><span class="snack-symbol">${categorySymbol[snack.category] || '◉'}</span><div class="snack-info"><strong>${snack.name}</strong><span>${snack.category} · ${snack.time}</span></div><span class="snack-kcal">${snack.calories} kcal</span></div>`).join('');
}
function render() { renderDate(); renderSummary(); renderChart(); renderList(); }

$('#open-modal').addEventListener('click', () => { $('#snack-modal').hidden = false; $('#snack-time').value = new Date().toTimeString().slice(0, 5); $('#snack-name').focus(); });
$('#close-modal').addEventListener('click', () => { $('#snack-modal').hidden = true; });
$('#snack-modal').addEventListener('click', (event) => { if (event.target === $('#snack-modal')) $('#snack-modal').hidden = true; });
document.querySelectorAll('.category-option').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.category-option').forEach((item) => item.classList.remove('selected')); button.classList.add('selected'); selectedCategory = button.dataset.category; }));
$('#snack-form').addEventListener('submit', (event) => { event.preventDefault(); snacks.push({ name: $('#snack-name').value.trim(), calories: Number($('#snack-calories').value), time: $('#snack-time').value, category: selectedCategory, date: formatDate(selectedDate) }); save(); render(); event.target.reset(); $('#snack-modal').hidden = true; });
$('#previous-day').addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() - 1); render(); });
$('#next-day').addEventListener('click', () => { selectedDate.setDate(selectedDate.getDate() + 1); render(); });
$('#edit-goal').addEventListener('click', () => { const nextGoal = Number(window.prompt('¿Cuántos snacks quieres permitirte por semana?', weeklyGoal)); if (nextGoal > 0 && nextGoal <= 100) { weeklyGoal = nextGoal; save(); render(); } });
render();
