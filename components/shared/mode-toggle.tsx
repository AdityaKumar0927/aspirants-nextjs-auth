import { Button } from "@/components/magicui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme(); // Use resolvedTheme to handle defaults

  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      className="px-2"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon
        className="h-[1.2rem] w-[1.2rem] text-neutral-800 dark:hidden"
        aria-hidden={resolvedTheme === "dark"}
      />
      <MoonIcon
        className="hidden h-[1.2rem] w-[1.2rem] text-neutral-800 dark:block"
        aria-hidden={resolvedTheme !== "dark"}
      />
    </Button>
  );
}
