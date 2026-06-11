// @/components/layout/NavigationMenuDemo.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const exams = [
  { title: "JEE", href: "#" },
  { title: "CUET", href: "#" },
  { title: "CBSE", href: "#" },
  { title: "A Levels", href: "#" },
  { title: "CAT", href: "#" },
  { title: "UPSC", href: "#" },
];

const automationTools = [
  { title: "PDF to Mock Exam", href: "#" },
  { title: "Develop", href: "#" },
  { title: "Productivity", href: "#" },
];

const support = [
  { title: "Survey", href: "#survey"},
  { title: "Donate", href: "#" },
  { title: "Report", href: "#" },
  { title: "Contact", href: "#" },
];

export function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/question-bank" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Question Bank
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Exams</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] lg:w-[400px]">
              {exams.map((exam) => (
                <ListItem key={exam.title} title={exam.title} href={exam.href} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Automation Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] lg:w-[400px]">
              {automationTools.map((tool) => (
                <ListItem key={tool.title} title={tool.title} href={tool.href} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Support</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-3 p-4 md:w-[300px] lg:w-[400px]">
              {support.map((item) => (
                <ListItem key={item.title} title={item.title} href={item.href} />
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
