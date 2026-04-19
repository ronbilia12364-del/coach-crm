"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Scale, Dumbbell, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal/nutrition", label: "תזונה", icon: Utensils },
  { href: "/portal/weight", label: "שקילות", icon: Scale },
  { href: "/portal/training", label: "אימונים", icon: Dumbbell },
  { href: "/portal/upload", label: "העלאה", icon: Camera },
  { href: "/portal/profile", label: "פרופיל", icon: User },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/portal" || pathname === "/portal/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-green-600">💪 פורטל מתאמן</h1>
      </header>

      <main className="flex-1 p-4 pb-24">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors",
                active ? "text-green-600" : "text-gray-400"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
