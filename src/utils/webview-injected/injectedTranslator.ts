import { getTranslatorQueueScript } from './translator/translatorQueue';
import { getTranslatorCollectorScript } from './translator/translatorCollector';
import { getTranslatorReverterScript } from './translator/translatorReverter';

// Injected Translator: DOM text scanner, batch queue, typewriter effect and cache
export function getInjectedTranslatorScript(useTypewriter: boolean = false): string {
  return `
    ${getTranslatorQueueScript(useTypewriter)}
    ${getTranslatorCollectorScript()}
    ${getTranslatorReverterScript()}
  `;
}

