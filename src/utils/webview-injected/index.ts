// Webview Injected Script Generator (Fractal Architecture)
import { getInjectedBaseScript } from './injectedBase';
import { getInjectedExtractorScript } from './injectedExtractor';
import { getInjectedHighlighterScript } from './injectedHighlighter';
import { getInjectedNavigationScript } from './navigation';
import { getInjectedTeacherScript } from './teacher';
import { getInjectedTranslatorScript } from './injectedTranslator';
import { getInjectedAdBlockDarkScript } from './injectedAdBlockDark';
import { getInjectedBridgeScript } from './injectedBridge';
import { getEjoyDictionaryScript } from './highlighter/ejoyDictionary';

export function createTranslateScript(useTypewriter: boolean = false): string {
  return `(function() {
    if (window.__translatorInitialized) return;
    window.__translatorInitialized = true;
    window.__autoTranslateEnabled = false;

    ${getInjectedBaseScript()}

    window.__TienHiepHelpers = {
      ${getInjectedExtractorScript()}
      ${getInjectedHighlighterScript()}
      ${getInjectedNavigationScript()}
      ${getInjectedTeacherScript()}
    };

    ${getInjectedTranslatorScript(useTypewriter)}
    ${getInjectedAdBlockDarkScript()}
    ${getInjectedBridgeScript()}
    ${getEjoyDictionaryScript()}
  })();`;
}
