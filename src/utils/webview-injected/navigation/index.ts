// Navigation Module aggregator for Injected Script
import { getNavigationRulesScript } from './nextRules';
import { getNextTargetScript } from './nextTarget';
import { getNavigatorTriggerScript } from './navigatorTrigger';

export function getInjectedNavigationScript(): string {
  return [
    getNavigationRulesScript(),
    getNextTargetScript(),
    getNavigatorTriggerScript(),
  ].join('\n');
}
