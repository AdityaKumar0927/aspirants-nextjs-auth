import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Navbar from "./navbar";
import { getServerSession } from "next-auth/next";
import { SidebarProvider, Sidebar, SidebarBody, SidebarLink } from './Sidebar';

export default async function Nav() {
  const session = await getServerSession(authOptions);

  return (
    <SidebarProvider>
      <Navbar session={session} />
      {session && (
        <Sidebar>
          <SidebarBody>
            <SidebarLink
              link={{ label: "Dashboard", href: "/", icon: <i className="fas fa-tachometer-alt"></i> }}
            />
            <SidebarLink
              link={{ label: "Question Bank", href: "/QuestionBank", icon: <i className="fas fa-book"></i> }}
            />
            <SidebarLink
              link={{ label: "Profile", href: "/profile", icon: <i className="fas fa-user"></i> }}
            />
            <SidebarLink
              link={{ label: "Settings", href: "/settings", icon: <i className="fas fa-cog"></i> }}
            />
            <SidebarLink
              link={{ label: "Logout", href: "/api/auth/signout", icon: <i className="fas fa-sign-out-alt"></i> }}
            />
          </SidebarBody>
        </Sidebar>
      )}
    </SidebarProvider>
  );
}
