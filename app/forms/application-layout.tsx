import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "./sidebar-nav";

export const metadata: Metadata = {
  title: "Forms",
  description: "Advanced form example using react-hook-form and Zod.",
};

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/forms",
  },
  {
    title: "Account",
    href: "/forms/account",
  },
  {
    title: "Privacy & Data",
    href: "/forms/privacy",
  },
  {
    title: "Feedback",
    href: "/forms/feedback",
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="w-full space-y-6 px-4 py-8 sm:px-6 md:p-10 md:pb-16">
      <div className="space-y-1">
        <p className="type-data text-[11px] uppercase tracking-[0.14em] text-pencil">
          Your desk
        </p>
        <h2 className="type-display text-3xl sm:text-4xl md:text-5xl">
          <span className="highlight-sweep">Settings</span>
        </h2>
        <p className="text-pencil">
          Manage your account details and email preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-2 sm:-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} className="" />
        </aside>
        <div className="w-full flex-1 md:min-h-[500px] lg:max-w-2xl lg:w-[640px]">{children}</div>
      </div>
    </div>
  );
}
