import { RoutePath } from '../context/AppContext';

/**
 * Returns report route without pre-selected segment (user manually selects category).
 */
export function getContextualReportRoute(_currentRoute?: RoutePath | string): string {
  return '/report';
}
