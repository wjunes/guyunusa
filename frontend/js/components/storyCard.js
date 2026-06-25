/**
 * storyCard.js — Tarjeta de acceso rápido a la historia de Guyunusa
 * Aparece al inicio del área de chat, antes de los mensajes.
 * Al hacer clic, el asistente narra la historia al usuario.
 */
import { EventBus } from '../modules/eventBus.js';
import { t }        from '../modules/i18n.js';

const STORY_PROMPT = {
  es: '¿Podés contarme la historia de cómo fue creada Guyunusa y quién es su creador?',
  en: 'Can you tell me the story of how Guyunusa was created and who its creator is?',
  pt: 'Pode me contar a história de como Guyunusa foi criada e quem é seu criador?',
};

export function createStoryCard(lang = 'es') {
  const prompt = STORY_PROMPT[lang] || STORY_PROMPT.es;

  const card = document.createElement('div');
  card.className = 'c-story-card';
  card.id = 'story-card';

  card.innerHTML = `
    <div class="c-story-card__sol">
      <svg width="36" height="36" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
        <style>
          .sc-rays { transform-origin:45px 45px; animation: sc-spin 14s linear infinite; }
          @keyframes sc-spin { to { transform: rotate(360deg); } }
        </style>
        <g class="sc-rays" opacity=".9">
          ${Array.from({length:16},(_,i)=>{
            const a=(i*360/16)*Math.PI/180;
            const x1=(45+22*Math.cos(a)).toFixed(1), y1=(45+22*Math.sin(a)).toFixed(1);
            const x2=(45+36*Math.cos(a)).toFixed(1), y2=(45+36*Math.sin(a)).toFixed(1);
            const x3=(45+31*Math.cos(a)).toFixed(1), y3=(45+31*Math.sin(a)).toFixed(1);
            return i%2===0
              ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8b84b" stroke-width="2.5" stroke-linecap="round"/>`
              : `<line x1="${x1}" y1="${y1}" x2="${x3}" y2="${y3}" stroke="#e8b84b" stroke-width="1.5" stroke-linecap="round"/>`;
          }).join('')}
        </g>
        <circle cx="45" cy="45" r="19" fill="#e8b84b"/>
        <circle cx="45" cy="45" r="16" fill="#f0c96a"/>
        <circle cx="39" cy="43" r="2" fill="#b8860b"/>
        <circle cx="51" cy="43" r="2" fill="#b8860b"/>
        <path d="M39 51 Q45 56 51 51" stroke="#b8860b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      </svg>
    </div>

    <div class="c-story-card__body">
      <div class="c-story-card__eyebrow">Historia de origen</div>
      <div class="c-story-card__title">
        La historia de Guyunusa y su creador
      </div>
      <p class="c-story-card__desc">
        Conocé cómo nació esta IA uruguaya, quién la construyó y por qué lleva este nombre.
      </p>
    </div>

    <button class="c-story-card__btn" aria-label="Leer la historia">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd"
          d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
      </svg>
    </button>
  `;

  card.addEventListener('click', () => {
    // Quitar la tarjeta con animación
    card.style.opacity = '0';
    card.style.transform = 'translateY(-8px)';
    setTimeout(() => card.remove(), 280);
    // Disparar el mensaje como si lo hubiera escrito el usuario
    EventBus.emit('message:send', prompt);
  });

  return card;
}
