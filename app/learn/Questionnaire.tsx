"use client";

import { Button } from "@/components/ui/button";
import {
  groupsFor,
  isFieldVisible,
  missingRequired,
  REQUIRED_FIELD_IDS,
  type KeystoneAnswers,
  type QField,
  type QuestionnaireMode,
} from "@/lib/keystone/questionnaire";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`type-data rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-ballpoint bg-ballpoint text-paper"
          : "border-rule bg-paper text-pencil hover:border-ballpoint/50 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  field,
  answers,
  setField,
}: {
  field: QField;
  answers: KeystoneAnswers;
  setField: (id: string, value: string | string[]) => void;
}) {
  const required = REQUIRED_FIELD_IDS.includes(field.id);
  const value = answers[field.id];

  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-ink">
        {field.label}
        {!required && <span className="type-data ml-1 text-[11px] text-pencil">(optional)</span>}
      </label>
      {field.help && <p className="type-data text-[11px] text-pencil">{field.help}</p>}

      {(field.kind === "single" || field.kind === "scale") && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => (
            <Chip key={o.value} active={value === o.value} onClick={() => setField(field.id, o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      )}

      {field.kind === "multi" && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => {
            const arr = Array.isArray(value) ? value : [];
            const active = arr.includes(o.value);
            return (
              <Chip
                key={o.value}
                active={active}
                onClick={() =>
                  setField(field.id, active ? arr.filter((v) => v !== o.value) : [...arr, o.value])
                }
              >
                {o.label}
              </Chip>
            );
          })}
        </div>
      )}

      {field.kind === "text" && (
        <input
          value={(value as string) ?? ""}
          onChange={(e) => setField(field.id, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-pencil focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/40"
        />
      )}
    </div>
  );
}

export default function Questionnaire({
  answers,
  setField,
  onSubmit,
  onBack,
  mode = "learning",
}: {
  answers: KeystoneAnswers;
  setField: (id: string, value: string | string[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  mode?: QuestionnaireMode;
}) {
  const missing = missingRequired(answers, mode);
  const ready = missing.length === 0;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="type-display text-xl text-ink">Personalize your lesson</h2>
        <p className="text-sm text-pencil">
          Just your relationship to the material — your AI reads the chapter itself. It’s quick, and nothing here is
          sent anywhere; it only shapes the prompt you’ll copy next.
        </p>
      </div>

      {groupsFor(mode).map((group) => (
        <section key={group.id} className="paper-sheet space-y-4 p-5">
          <div className="space-y-0.5">
            <h3 className="type-display text-base text-ink">{group.title}</h3>
            <p className="type-data text-[11px] text-pencil">{group.blurb}</p>
          </div>
          <div className="space-y-4">
            {group.fields
              .filter((f) => isFieldVisible(f, answers))
              .map((f) => (
                <Field key={f.id} field={f} answers={answers} setField={setField} />
              ))}
          </div>
        </section>
      ))}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-3">
          {!ready && (
            <span className="type-data text-[11px] text-pencil">
              {missing.length} required answer{missing.length === 1 ? "" : "s"} left
            </span>
          )}
          <Button
            onClick={onSubmit}
            disabled={!ready}
            className="bg-ballpoint text-paper hover:bg-ballpoint/90"
          >
            Compile my prompt →
          </Button>
        </div>
      </div>
    </div>
  );
}
