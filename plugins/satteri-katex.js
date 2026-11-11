import katex from 'katex';
import { defineMdastPlugin } from 'satteri';

const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

const preserveBackslashes = (html) => html.replace(/\\/g, '\\\\');

export function satteriKatex(options = {}) {
  const katexOptions = { output: 'htmlAndMathml', throwOnError: true, ...options };

  const render = (tex, displayMode) => {
    try {
      const rendered = katex.renderToString(tex, { ...katexOptions, displayMode });
      return { raw: preserveBackslashes(rendered), mdxExpressions: false };
    } catch (error) {
      return { raw: preserveBackslashes(escapeHtml(String(error))), mdxExpressions: false };
    }
  };

  return defineMdastPlugin({
    name: 'satteri-katex',
    math(node) {
      return render(node.value, true);
    },
    inlineMath(node) {
      return render(node.value, false);
    },
  });
}