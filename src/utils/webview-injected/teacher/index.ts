// Teacher Module aggregator for Injected Script
import { getTeachUiScript } from './teachUi';
import { getTeachScannerScript } from './teachScanner';
import { getTeachControlsScript } from './teachControls';
import { getTeachEventsScript } from './teachEvents';

export function getInjectedTeacherScript(): string {
  return `
    startTeachNextMode: () => {
      ${getTeachUiScript()}
      ${getTeachScannerScript()}
      ${getTeachControlsScript()}
      ${getTeachEventsScript()}
    },
  `;
}
