import { SECTIONS } from '../../theme/tokens';

const CATEGORY_ROUTES = Object.values(SECTIONS).map((section) => section.slug);
const BACK_NAV_ROUTE_PREFIXES = ['/report-detail/', '/location/', '/subject/'];
const CONTEXTUAL_ROUTES = ['/search'];

export const shouldHideBottomNav = (
  currentRoute: string,
  categoryRoutes: string[] = CATEGORY_ROUTES
): boolean =>
  categoryRoutes.includes(currentRoute) ||
  CONTEXTUAL_ROUTES.includes(currentRoute) ||
  BACK_NAV_ROUTE_PREFIXES.some((prefix) => currentRoute.startsWith(prefix));
