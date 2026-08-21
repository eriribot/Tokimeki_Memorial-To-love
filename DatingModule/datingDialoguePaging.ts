const DATING_DIALOGUE_SELECTOR = '.gal-main-story__dialogue';

const DATING_DIALOGUE_CONTROL_SELECTOR = [
  '.gal-main-story__controls',
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
].join(', ');

interface DatingDialogueClick {
  defaultPrevented: boolean;
  target: EventTarget | null;
}

interface ClosestEventTarget extends EventTarget {
  closest: (selectors: string) => unknown;
}

function supportsClosest(target: EventTarget | null): target is ClosestEventTarget {
  return Boolean(target && typeof (target as Partial<ClosestEventTarget>).closest === 'function');
}

export function isDatingDialogueControlTarget(target: EventTarget | null): boolean {
  return supportsClosest(target) && Boolean(target.closest(DATING_DIALOGUE_CONTROL_SELECTOR));
}

/**
 * Dating pages own their cursor outside the shared Gal renderer. Only a click
 * on the rendered dialogue surface advances it; controls keep their own event.
 */
export function shouldAdvanceDatingDialogueClick(event: DatingDialogueClick): boolean {
  if (event.defaultPrevented || !supportsClosest(event.target)) return false;
  if (!event.target.closest(DATING_DIALOGUE_SELECTOR)) return false;
  return !isDatingDialogueControlTarget(event.target);
}
