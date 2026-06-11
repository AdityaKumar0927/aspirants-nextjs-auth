import type { Metadata } from "next";
import ImportWizard from "./ImportWizard";

export const metadata: Metadata = {
  title: "Import Questions from PDF",
};

// Access is enforced by middleware.ts (administrator role) and again by the
// import API routes themselves.
export default function ImportQuestionsPage() {
  return <ImportWizard />;
}
