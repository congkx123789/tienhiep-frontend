import { getHighlighterBaseScript } from './highlighter/highlighterBase';
import { getParagraphIndexerScript } from './highlighter/paragraphIndexer';
import { getInlineNotebookScript } from './highlighter/inlineNotebook';

// Injected Highlighter: Paragraph indexing, TTS span wrapping & active sentence highlight
export function getInjectedHighlighterScript(): string {
  return `
    ${getHighlighterBaseScript()}
    ${getParagraphIndexerScript()}
    ${getInlineNotebookScript()}
  `;
}
