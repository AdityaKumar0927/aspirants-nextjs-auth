import type { SVGProps } from "react"

/**
 * Hand-drawn icon set for the admin surface — not a third-party icon font.
 * One visual language: 24×24 grid, 1.6 stroke, round joins, currentColor, no
 * fill. Motifs come from the "Desk" identity (ruled paper, ballpoint, OMR,
 * red-pen tick) so the dashboard reads as one designed product rather than a
 * grab-bag of library glyphs.
 */

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Ruled question sheet with a folded corner — the question bank. */
export function IconPaper(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V8.5z" />
      <path d="M13 3.5V8.5H18" />
      <path d="M9 12.5h6M9 15.3h6M9 18.1h3.5" />
    </Icon>
  )
}

/** Two aspirants — the member community. */
export function IconPeople(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8.5" r="3" />
      <path d="M4 19.5c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" />
      <path d="M15.4 6.2a2.6 2.6 0 0 1 .2 5" />
      <path d="M16.7 14.4c2 .5 3.3 2.3 3.3 4.6" />
    </Icon>
  )
}

/** Speech bubble with lines — feedback. */
export function IconChat(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 6.6A1.8 1.8 0 0 1 6.8 4.8h10.4A1.8 1.8 0 0 1 19 6.6v6.6a1.8 1.8 0 0 1-1.8 1.8H10l-3.7 3.2v-3.2H6.8A1.8 1.8 0 0 1 5 13.2z" />
      <path d="M8.5 8.9h7M8.5 11.4h4.5" />
    </Icon>
  )
}

/** Shield with a tick — compliance / data requests. */
export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l6 2.1v5.1c0 3.7-2.4 6.8-6 8.3-3.6-1.5-6-4.6-6-8.3V5.6z" />
      <path d="M9.4 11.6l1.8 1.8 3.6-3.7" />
    </Icon>
  )
}

/** Clipboard with lines — applications. */
export function IconClipboard(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5H7a1.3 1.3 0 0 0-1.3 1.3V19.2A1.3 1.3 0 0 0 7 20.5h10a1.3 1.3 0 0 0 1.3-1.3V6.3A1.3 1.3 0 0 0 17 5h-2" />
      <rect x="9" y="3.4" width="6" height="3.2" rx="1" />
      <path d="M8.7 10.6h6.6M8.7 13.6h6.6M8.7 16.6h4" />
    </Icon>
  )
}

/** Ballpoint pen drawing — drafts awaiting review. */
export function IconPencil(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 19l1-3.6 9.3-9.3a1.6 1.6 0 0 1 2.3 0l.3.3a1.6 1.6 0 0 1 0 2.3L8.6 18z" />
      <path d="M14 7.6l2.4 2.4" />
      <path d="M6 15.4L8.6 18" />
    </Icon>
  )
}

/** Page dropping into a tray — import. */
export function IconImport(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v8.6" />
      <path d="M8.3 9.3L12 13l3.7-3.7" />
      <path d="M5 14.6V18a1.3 1.3 0 0 0 1.3 1.3h11.4A1.3 1.3 0 0 0 19 18v-3.4" />
    </Icon>
  )
}

/** Aspirant with a rank star — roles & staff. */
export function IconRoles(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="8" r="3" />
      <path d="M4.5 19c0-3.1 2.4-5.2 5.5-5.2 1 0 2 .2 2.8.6" />
      <path d="M17 12.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" />
    </Icon>
  )
}

/** Ticked checklist — issues board. */
export function IconChecklist(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="4" width="14" height="16" rx="1.6" />
      <path d="M7.8 9l1.3 1.3L11.6 7.7" />
      <path d="M13.6 9.2h3" />
      <path d="M7.8 14.2l1.3 1.3 2.5-2.6" />
      <path d="M13.6 14.4h3" />
    </Icon>
  )
}

/** Right chevron — "open this". */
export function IconArrow(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5l6.5 6.5L9 18.5" />
    </Icon>
  )
}

/** Diagonal out-arrow — navigates away (action cards). */
export function IconArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 16.5l9-9" />
      <path d="M9 7.5h7.5V15" />
    </Icon>
  )
}

/** Rising line with arrow — positive delta. */
export function IconTrendUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 15l5-5 3 3 7-7" />
      <path d="M15.5 6H19v3.5" />
    </Icon>
  )
}

/** Flat line with arrow — no change. */
export function IconTrendFlat(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h12" />
      <path d="M13 9l3 3-3 3" />
    </Icon>
  )
}

/** Circled tick — resolved / all clear. */
export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.4 12.3l2.4 2.4 4.8-5.2" />
    </Icon>
  )
}

/** Warning triangle — overdue / needs attention. */
export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.2l8.3 14.3a.8.8 0 0 1-.7 1.2H4.4a.8.8 0 0 1-.7-1.2z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.3h.01" />
    </Icon>
  )
}

/** Four panes — the dashboard / overview. */
export function IconGrid(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </Icon>
  )
}

/** Cog — settings. */
export function IconGear(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3L5.6 5.6" />
    </Icon>
  )
}

/** Door with out-arrow — sign out. */
export function IconLogout(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6A1.5 1.5 0 0 0 14 18.5V17" />
      <path d="M10 12h10" />
      <path d="M17 9l3 3-3 3" />
    </Icon>
  )
}

/** Hamburger — open navigation. */
export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

/** Cross — close / dismiss. */
export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

/** Magnifier — search. */
export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.2 4.2" />
    </Icon>
  )
}

/** Funnel — filter. */
export function IconFilter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5h15l-5.8 6.9v5.1l-3.4 1.8v-6.9z" />
    </Icon>
  )
}

/** Down chevron — expand / collapse. */
export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 9l6.5 6.5L18.5 9" />
    </Icon>
  )
}

/** Bin — delete. */
export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.6 7l.8 11.1A1.5 1.5 0 0 0 8.9 19.5h6.2a1.5 1.5 0 0 0 1.5-1.4L17.4 7" />
      <path d="M10 10.5v5.5M14 10.5v5.5" />
    </Icon>
  )
}

/** Open arc — loading spinner (add `animate-spin` via className). */
export function IconSpinner(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="40 14" />
    </Icon>
  )
}

/** Brand emblem — an answer sheet with a red-pen tick. */
export function IconDeskMark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3.5h6.5L18 8v11.5a1.3 1.3 0 0 1-1.3 1.3H7.3A1.3 1.3 0 0 1 6 19.5V4.8A1.3 1.3 0 0 1 7 3.5z" />
      <path d="M13 3.5V8.5H18" />
      <path d="M9 13.4l2 2 4-4.4" />
    </Icon>
  )
}
