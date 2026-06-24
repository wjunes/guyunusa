/**
 * Parser de markdown mínimo — sin dependencias externas
 * Soporta: bold, italic, code inline, code blocks, listas, párrafos
 */
export function parseMarkdown(text) {
  if (!text) return '';

  // Escapar HTML primero
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```...```
  out = out.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);

  // Code inline `...`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **...**
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *...*
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Listas con -
  out = out.replace(/^- (.+)$/gm, '<li>$1</li>');
  out = out.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');

  // Listas numeradas
  out = out.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Saltos de línea → párrafos
  out = out
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.startsWith('<') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return out;
}
