import KeystoneClient from "./KeystoneClient";

/**
 * Keystone — Learning Mode (MVP).
 *
 * No account or API key required: the entire flow (questionnaire → compiled
 * prompt → paste lesson JSON → interactive player) runs client-side and persists
 * to localStorage. The student's chapter never reaches our servers — it goes only
 * into their own LLM. Hence no auth gate here; guests can use it too.
 */
export const metadata = {
  title: "Keystone — understand it, don't just memorize it",
};

export default function KeystonePage() {
  return <KeystoneClient />;
}
