import { CAdapter } from './CAdapter.js';
import { CppAdapter } from './CppAdapter.js';
import { JavaAdapter } from './JavaAdapter.js';
import { PythonAdapter } from './PythonAdapter.js';
import { JavaScriptAdapter } from './JavaScriptAdapter.js';
import { GoAdapter } from './GoAdapter.js';
import { SqlAdapter } from './SqlAdapter.js';
import { resolveLanguage } from '../registry/languages.js';

export function getAdapterForLanguage(langInput) {
  const lang = resolveLanguage(langInput);
  switch (lang.key) {
    case 'c': return new CAdapter(lang);
    case 'cpp': return new CppAdapter(lang);
    case 'java': return new JavaAdapter(lang);
    case 'python': return new PythonAdapter(lang);
    case 'javascript': return new JavaScriptAdapter(lang);
    case 'go': return new GoAdapter(lang);
    case 'sql': return new SqlAdapter(lang);
    default:
      throw new Error(`No adapter implemented for language ${lang.key}`);
  }
}
