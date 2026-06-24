/**
 * Modal de confirmación reutilizable
 * Retorna una Promise que resuelve true/false
 */
export function confirm(title, body) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'c-modal-overlay';
    overlay.innerHTML = `
      <div class="c-modal" role="dialog" aria-modal="true">
        <div class="c-modal__title">${title}</div>
        <div class="c-modal__body">${body}</div>
        <div class="c-modal__actions">
          <button class="btn btn--ghost" id="modal-cancel">Cancelar</button>
          <button class="btn btn--primary" id="modal-confirm"
            style="width:auto;background:#c0392b;">Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => { overlay.remove(); resolve(val); };
    overlay.querySelector('#modal-cancel').addEventListener('click',  () => close(false));
    overlay.querySelector('#modal-confirm').addEventListener('click', () => close(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
  });
}
