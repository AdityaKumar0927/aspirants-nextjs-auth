import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Navbar from "./navbar";
import { getServerSession } from "next-auth/next";
import { SidebarProvider, Sidebar, SidebarBody, SidebarLink } from "./Sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import Link from "next/link"; // Ensure Link is imported
import Image from "next/image"; // Ensure Image is imported
import { motion } from "framer-motion"; // Ensure motion is imported

export default async function Nav() {
  const session = await getServerSession(authOptions);

  return (
    <SidebarProvider>
      <Navbar session={session} />
      {session && (
        <Sidebar>
          <SidebarBody className="justify-between gap-10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {true ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {[
                  {
                    label: "Dashboard",
                    href: "/",
                    icon: (
                      <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  },
                  {
                    label: "Profile",
                    href: "/profile",
                    icon: (
                      <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  },
                  {
                    label: "Settings",
                    href: "/settings",
                    icon: (
                      <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  },
                  {
                    label: "Logout",
                    href: "/api/auth/signout",
                    icon: (
                      <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                    ),
                  },
                ].map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              <SidebarLink
                link={{
                  label: "Manu Arora",
                  href: "#",
                  icon: (
                    <Image
                      src="https://assets.aceternity.com/manu.png"
                      className="h-7 w-7 flex-shrink-0 rounded-full"
                      width={50}
                      height={50}
                      alt="Avatar"
                    />
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
      )}
    </SidebarProvider>
  );
}

const Logo = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        Acet Labs
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link
      href="#"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
