export const FORM_CONTROL_BASE =
  'w-full min-h-[44px] bg-role-surface text-role-on-surface ui-border-default ui-radius-control px-[var(--field-padding-x)] ui-space-field-y type-body placeholder:text-role-on-surface-muted transition-colors focus:outline-none focus:ring-2 disabled:bg-role-surface-subtle disabled:text-role-on-surface-muted disabled:cursor-not-allowed';

export const FORM_TEXTAREA_BASE =
  'w-full min-h-[96px] bg-role-surface text-role-on-surface ui-border-default ui-radius-control ui-space-textarea type-body placeholder:text-role-on-surface-muted transition-colors focus:outline-none focus:ring-2 disabled:bg-role-surface-subtle disabled:text-role-on-surface-muted disabled:cursor-not-allowed resize-y';

export const formControlStateClass = (hasError = false) =>
  hasError
    ? 'border-role-validation-outline focus:ring-role-validation-focus focus:border-role-validation-focus'
    : 'border-role-outline hover:border-role-outline-strong focus:ring-role-focus focus:border-role-focus';

export const joinFormClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const formFieldIds = (id: string) => ({
  helperId: `${id}-helper`,
  errorId: `${id}-error`,
  labelId: `${id}-label`,
});
