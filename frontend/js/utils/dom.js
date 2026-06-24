/**
 * Helpers de manipulación del DOM
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') elem.className = v;
    else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
    else elem.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (typeof c === 'string') elem.appendChild(document.createTextNode(c));
    else if (c) elem.appendChild(c);
  });
  return elem;
}

export function setHTML(container, html) {
  if (typeof container === 'string') container = $(container);
  if (container) container.innerHTML = html;
}

export function show(el) { el && el.classList.remove('u-hidden'); }
export function hide(el) { el && el.classList.add('u-hidden'); }

export function clearApp() {
  const app = $('#app');
  if (app) app.innerHTML = '';
  return app;
}
