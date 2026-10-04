// Teacher Module aggregator for Injected Script
import { getTeachUiScript } from './teachUi';
import { getTeachRulesScript } from './teachRules';
import { getTeachScannerScript } from './teachScanner';
import { getTeachControlsScript } from './teachControls';
import { getTeachActionsScript } from './teachActions';
import { getTeachEventsScript } from './teachEvents';

export function getInjectedTeacherScript(): string {
  return `
    startTeachNextMode: () => {
      ${getTeachUiScript()}
      ${getTeachRulesScript()}
      ${getTeachScannerScript()}
      ${getTeachControlsScript()}
      ${getTeachActionsScript()}
      ${getTeachEventsScript()}
    },
  `;
}
