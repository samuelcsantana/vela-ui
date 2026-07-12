// Shared visual language for the tenant create/edit dialogs, so both forms stay
// in lockstep: dialog chrome, section headers, field controls and upload cards.

export const DIALOG_OVERLAY_CLASSNAME =
  'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200';

export const DIALOG_PANEL_CLASSNAME =
  'flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-3rem)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-4 motion-safe:duration-300';

export const DIALOG_CLOSE_BUTTON_CLASSNAME =
  'flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export const CANCEL_BUTTON_CLASSNAME =
  'min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export const SUBMIT_BUTTON_CLASSNAME =
  'min-h-11 cursor-pointer rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60';

export const FIELD_CLASSNAME =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

export const HELPER_TEXT_CLASSNAME = 'text-xs text-muted-foreground';

// Swatch + hex text combined into a single bordered control; the ring moves to the
// wrapper via focus-within so the pair reads as one field.
export const COLOR_CONTROL_CLASSNAME =
  'flex items-center gap-1 rounded-lg border border-slate-300 bg-white pl-2 shadow-sm transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15';

export const COLOR_SWATCH_CLASSNAME =
  'h-7 w-7 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-transparent p-0.5';

export const COLOR_TEXT_INPUT_CLASSNAME =
  'w-full min-w-0 rounded-lg border-0 bg-transparent px-2 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none';

// The file input stretches invisibly over the whole card, so the entire area is
// clickable and keyboard-focusable while the label association stays intact.
export const UPLOAD_CARD_CLASSNAME =
  'relative flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 transition-colors hover:border-brand/60 hover:bg-brand/5 has-[input:focus-visible]:border-brand has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-brand/15';

export const UPLOAD_INPUT_CLASSNAME = 'absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0';

export const UPLOAD_THUMB_CLASSNAME =
  'flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white';

export const SEGMENT_LABEL_CLASSNAME =
  'cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand';

export const SECTION_CLASSNAME = 'flex min-w-0 flex-col gap-4 py-6 first:pt-0 last:pb-0';

export const SECTION_LEGEND_CLASSNAME =
  'mb-4 flex items-center gap-2.5 text-sm font-semibold text-foreground';

export const SECTION_ICON_CLASSNAME =
  'flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand';
