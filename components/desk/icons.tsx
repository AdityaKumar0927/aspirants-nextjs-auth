import type { SVGProps } from "react"

/**
 * Hand-drawn icons for the question bank / public surfaces — not a library font.
 * Exported under lucide-compatible names so call sites swap with just the import.
 * 24×24 grid, 1.6 stroke, round joins, currentColor, no fill.
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

/** Bare tick — mark complete. */
export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Icon>
  )
}

/** Pennant flag — flag for review (fills when given a `fill-*` class). */
export function Flag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11l-2.3 3.3 2.3 3.2H5.5" />
    </Icon>
  )
}

/** Cross — close / dismiss. */
export function X(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

/** Down chevron — expand / select. */
export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 9l6.5 6.5L18.5 9" />
    </Icon>
  )
}

/** Circled tick — correct result. */
export function CheckCircle2(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.3 12.3l2.5 2.5 4.9-5.4" />
    </Icon>
  )
}

/** Circled cross — incorrect result. */
export function XCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
    </Icon>
  )
}

/** Price tag — custom labels. */
export function Tag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 13.4V5.4A1.4 1.4 0 0 1 5.4 4h8l6.2 6.2a1.4 1.4 0 0 1 0 2L13.4 19a1.4 1.4 0 0 1-2 0L4 13.4z" />
      <circle cx="8.4" cy="8.4" r="1.1" />
    </Icon>
  )
}

/** Bar chart on an axis — performance. */
export function Chart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4.5v15h15.5" />
      <path d="M8 19.5V14" />
      <path d="M12.7 19.5V9.5" />
      <path d="M17.4 19.5V6.5" />
    </Icon>
  )
}

/** Magnifier — search. */
export function Search(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.5 15.5L20 20" />
    </Icon>
  )
}

/** Two curved arrows — refresh / re-rank. */
export function Refresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.8 11.5a7.2 7.2 0 0 1 12.1-4.4L20 9.5" />
      <path d="M20 4.5v5h-5" />
      <path d="M19.2 12.5a7.2 7.2 0 0 1-12.1 4.4L4 14.5" />
      <path d="M4 19.5v-5h5" />
    </Icon>
  )
}

/** Winner's cup — top rank. */
export function Trophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4.5h8v4.2a4 4 0 0 1-8 0V4.5z" />
      <path d="M8 5.7H5.2v1.8A2.8 2.8 0 0 0 8 10.3" />
      <path d="M16 5.7h2.8v1.8a2.8 2.8 0 0 1-2.8 2.8" />
      <path d="M12 12.7V16" />
      <path d="M9.3 19.5h5.4l-.6-3.5H9.9z" />
    </Icon>
  )
}

/** Five-point crown — the leader. */
export function Crown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.5l3.2 7.5h9.6L20 8.5l-4.5 3.3L12 6l-3.5 5.8z" />
      <path d="M7 18.5h10" />
    </Icon>
  )
}

/** Bullseye — accuracy. */
export function Target(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

/** Two figures — people / aspirants. */
export function Users(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.4" r="2.9" />
      <path d="M3.6 19a5.4 5.4 0 0 1 10.8 0" />
      <path d="M15.6 6.1a2.9 2.9 0 0 1 0 5.4" />
      <path d="M16.8 14.1A5.4 5.4 0 0 1 20.4 19" />
    </Icon>
  )
}

/** Stacked sheets — total attempts. */
export function Layers(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5l8 4.3-8 4.3-8-4.3z" />
      <path d="M4 12.2l8 4.3 8-4.3" />
      <path d="M4 16.2l8 4.3 8-4.3" />
    </Icon>
  )
}

/** Padlock — sign-in / save-gated actions. */
export function Lock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="10.4" width="14" height="9.6" rx="2.2" />
      <path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4" />
      <path d="M12 14v2.4" />
    </Icon>
  )
}

/** Circled "i" — informational. */
export function Info(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v4.6" />
      <circle cx="12" cy="7.9" r="0.55" fill="currentColor" stroke="none" />
    </Icon>
  )
}

/** Funnel — filters. */
export function Filter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5h16l-6.2 7.4v5.1l-3.6 1.5v-6.6z" />
    </Icon>
  )
}

/* Medallion glyphs — bold and BARE (the coloured circle behind them is the
   medallion, so these never draw their own ring). Tuned for white-on-colour. */

/** Bold tick — success. */
export function MedalCheck(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="M6.2 12.4l3.7 3.8L17.8 7.4" />
    </Icon>
  )
}

/** Bold cross — error. */
export function MedalCross(props: IconProps) {
  return (
    <Icon strokeWidth={2.4} {...props}>
      <path d="M7.6 7.6l8.8 8.8M16.4 7.6l-8.8 8.8" />
    </Icon>
  )
}

/** Bold pennant on a staff — flagged for review. */
export function MedalFlag(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <path d="M7.4 3.9v16.2" />
      <path d="M7.4 5h9l-2.4 3.1 2.4 3.1h-9" />
    </Icon>
  )
}

/** Bold padlock — sign-in / save-gated. */
export function MedalLock(props: IconProps) {
  return (
    <Icon strokeWidth={2.2} {...props}>
      <rect x="5.9" y="10.6" width="12.2" height="8.8" rx="2.3" />
      <path d="M8.5 10.6V8.3a3.5 3.5 0 0 1 7 0v2.3" />
      <path d="M12 13.9v2.3" />
    </Icon>
  )
}
