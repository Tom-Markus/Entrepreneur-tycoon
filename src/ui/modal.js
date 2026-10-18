// Fenêtres modales accessibles (focus piégé, Échap pour fermer si autorisé).

let current = null;

/**
 * Ouvre une modale.
 * @param {object} o
 * @param {string} o.title
 * @param {string} o.html contenu
 * @param {boolean} [o.closable=true]
 * @param {string} [o.cls]
 * @param {(root:HTMLElement)=>void} [o.onMount]
 * @param {()=>void} [o.onClose]
 */
export function openModal({ title, html, closable = true, cls = '', onMount, onClose }) {
  closeModal(true);
  const root = document.getElementById('modal-root');
  const prevFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head"><h2 id="modal-title" class="pixel-title">${title}</h2>${closable ? '<button type="button" class="btn btn-icon modal-x" aria-label="Fermer">✕</button>' : ''}</div>
      <div class="modal-body">${html}</div>
    </div>`;
  root.appendChild(wrap);
  current = { wrap, closable, onClose, prevFocus };
  if (closable) {
    wrap.querySelector('.modal-x').addEventListener('click', () => closeModal());
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap) closeModal();
    });
  }
  wrap.addEventListener('keydown', trapFocus);
  if (onMount) onMount(wrap.querySelector('.modal'));
  const f = wrap.querySelector('[autofocus], .modal-body button, .modal-body input, .modal-body select, .modal-x');
  if (f) f.focus();
  return wrap.querySelector('.modal');
}

function trapFocus(e) {
  if (e.key !== 'Tab' || !current) return;
  const items = Array.from(current.wrap.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
    (x) => !x.disabled && x.offsetParent !== null,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

export function closeModal(force = false) {
  if (!current) return false;
  if (!current.closable && !force) return false;
  const c = current;
  current = null;
  c.wrap.remove();
  if (c.onClose) c.onClose();
  if (c.prevFocus && c.prevFocus.focus) c.prevFocus.focus();
  return true;
}

export function isModalOpen() {
  return current !== null;
}

export function modalBody() {
  return current ? current.wrap.querySelector('.modal-body') : null;
}
