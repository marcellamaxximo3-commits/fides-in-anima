'use strict';
const $ = id => document.getElementById(id);
let entries = [], promptEvent, currentReading = '', boundaryTimer;
const RELEASE = '20260925-4';

function day(now = new Date()) {
  const date = new Date(now);
  if (date.getHours() < 2) date.setDate(date.getDate() - 1);
  return { date, number: Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000) };
}
function index(n, length) {
  let x = (n + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return ((x ^ (x >>> 15)) >>> 0) % length;
}
function paint(number, readingIndex) {
  const scene = ((number % 4) + 4) % 4;
  const positions = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'];
  document.documentElement.dataset.scene = String(scene);
  document.documentElement.style.setProperty('--art-position', positions[scene]);
  document.documentElement.style.setProperty('--companion-position', positions[(scene + 1 + readingIndex % 3) % 4]);
  document.documentElement.style.setProperty('--art-rotation', `${(readingIndex % 9) - 4}deg`);
  const descriptions = ['Cosmos azuis e lilases com margaridas amarelas em aquarela.', 'Margaridas cor-de-rosa e flores em tons de pêssego em aquarela.', 'Flores delicadas em azul, lavanda e rosa em aquarela.', 'Flores amarelas e corais com ramos verde-azulados em aquarela.'];
  $('reading-art').setAttribute('aria-label', descriptions[scene]);
}
function render() {
  const { date, number } = day();
  $('date').textContent = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const psalm = index(number, 150) + 1;
  $('psalm').textContent = `Ler Salmo ${psalm} no jw.org ↗`;
  $('psalm').href = `https://www.jw.org/pt/biblioteca/biblia/bi12/livros/salmos/${psalm}/`;
  const readingIndex = entries.length ? index(number, entries.length) : 0;
  paint(number, readingIndex);
  if (!entries.length) return;
  const key = `${number}:${entries.length}:${readingIndex}`;
  if (key === currentReading) return;
  const e = entries[readingIndex];
  $('source').textContent = e.book;
  $('title').textContent = e.title;
  $('text').textContent = e.text;
  $('credit').textContent = e.author + (e.chapter ? ' · ' + e.chapter : '');
  currentReading = key;
}
function refresh() {
  render();
  clearTimeout(boundaryTimer);
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  boundaryTimer = setTimeout(refresh, next.getTime() - now.getTime() + 100);
}
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); promptEvent = event; });
function installed() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone; }
$('install').onclick = async () => {
  if (promptEvent) { await promptEvent.prompt(); promptEvent = null; return; }
  $('instructions').textContent = installed() ? 'O Fides in anima já está instalado neste aparelho.' : /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Confirme em Adicionar.' : 'No Chrome do celular, abra o menu ⋮ e escolha Instalar aplicativo ou Adicionar à tela inicial.';
  $('help').showModal();
};
$('close').onclick = () => $('help').close();
window.addEventListener('appinstalled', () => { $('install').textContent = 'Instalado'; promptEvent = null; });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
window.addEventListener('pageshow', refresh);
window.addEventListener('focus', refresh);
setInterval(refresh, 30000);
refresh();
fetch(`./leituras.json?v=${RELEASE}`).then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => { entries = data.entries; refresh(); }).catch(() => { $('text').textContent = 'Não foi possível carregar a leitura. Confira sua conexão e abra novamente.'; });
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) { reloading = true; location.reload(); }
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => { $('status').textContent = 'A leitura está disponível, mas não foi possível atualizar o modo offline.'; });
}
