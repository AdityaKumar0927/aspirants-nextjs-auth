import { cn } from "@/lib/utils";

/* ===========================================================================
   Desk primitives — the OMR language and paper furniture.
   Presentational only; all styling comes from app/desk.css tokens. These are
   the ONLY building blocks inner pages should use for selection/status/paper,
   so the signature stays consistent everywhere.
   =========================================================================== */

export type OmrVerdict = "correct" | "wrong" | "reveal";
export type OmrStatus = "answered" | "review" | "notvisited" | "unanswered";

/**
 * An OMR bubble — the app's signature selection mark. `filled` = inked.
 * `verdict` recolors the ink after grading; `status` is for answer-sheet
 * palettes (CBT legend). Pass a single letter/number as children.
 */
export function OmrBubble({
  children,
  filled = false,
  verdict,
  status,
  className,
}: {
  children: React.ReactNode;
  filled?: boolean;
  verdict?: OmrVerdict;
  status?: OmrStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("omr-bubble", className)}
      data-state={filled ? "filled" : undefined}
      data-verdict={verdict}
      data-status={status}
    >
      <span>{children}</span>
    </span>
  );
}

/** The paper sheet every inner page lays its content on. */
export function PaperSheet({
  children,
  className,
  ruled = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds the exam-booklet red margin rule down the left edge. */
  ruled?: boolean;
}) {
  return (
    <div className={cn("paper-sheet", ruled && "ruled-margin", className)}>
      {children}
    </div>
  );
}

/** Mono marks chip: "+4 / −1". Red pen only ever touches the negative. */
export function MarksChip({
  positive,
  negative,
  className,
}: {
  positive: number | string;
  negative?: number | string | null;
  className?: string;
}) {
  return (
    <span className={cn("type-data text-xs text-pencil", className)}>
      <span className="text-st-answered">+{positive}</span>
      {negative != null && Number(negative) !== 0 && (
        <>
          {" / "}
          <span className="text-redpen">−{negative}</span>
        </>
      )}
    </span>
  );
}

/** CBT status legend — the colors every aspirant already knows. */
export function StatusLegend({ className }: { className?: string }) {
  const items: { status: OmrStatus | "current"; label: string }[] = [
    { status: "answered", label: "Answered" },
    { status: "review", label: "Marked for review" },
    { status: "notvisited", label: "Not visited" },
  ];
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs text-pencil">
          <OmrBubble status={item.status as OmrStatus} className="h-4 w-4 border" >
            {""}
          </OmrBubble>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Section eyebrow in exam-paper officialese: "SECTION A — PHYSICS". */
export function PaperEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "type-data text-[11px] uppercase tracking-[0.14em] text-pencil",
        className
      )}
    >
      {children}
    </p>
  );
}
