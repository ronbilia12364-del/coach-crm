"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Phone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/crm", label: "דשבורד", icon: LayoutDashboard },
  { href: "/crm/clients", label: "מתאמנים", icon: Users },
  { href: "/crm/leads", label: "לידים", icon: UserPlus },
  { href: "/crm/calls", label: "שיחות", icon: Phone },
  { href: "/crm/payments", label: "תשלומים", icon: CreditCard },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-green-400">💪 Coach CRM</h1>
          <p className="text-xs text-gray-400 mt-1">ניהול עסק המאמן</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Link
            href="/portal"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-400 transition-colors"
          >
            ← פורטל מתאמן
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 mr-64 p-8 min-h-screen">{children}</main>
    </div>
  );
}
