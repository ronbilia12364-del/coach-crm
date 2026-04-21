"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, UserPlus, Phone, CreditCard, Send, Bell, Menu, X } from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import NewLeadNotifier from "@/components/crm/NewLeadNotifier";

const navItems = [
  { href: "/crm", label: "דשבורד", icon: LayoutDashboard },
  { href: "/crm/clients", label: "מתאמנים", icon: Users },
  { href: "/crm/leads", label: "לידים", icon: UserPlus },
  { href: "/crm/calls", label: "שיחות", icon: Phone },
  { href: "/crm/payments", label: "תשלומים", icon: CreditCard },
  { href: "/crm/broadcast", label: "שליחה מרוכזת", icon: Send },
  { href: "/crm/settings/notifications", label: "הגדרות התראות", icon: Bell },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400">💪 Coach CRM</h1>
          <p className="text-xs text-gray-400 mt-1">ניהול עסק המאמן</p>
        </div>
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/crm" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
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
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-green-400 transition-colors"
        >
          ← פורטל מתאמן
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col fixed h-full z-30">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-72 bg-gray-900 text-white flex flex-col z-30 transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 md:mr-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 sticky top-0 z-10">
          <h1 className="text-base font-bold text-green-400">💪 Coach CRM</h1>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="פתח תפריט"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      <NewLeadNotifier />
      <Toaster position="top-right" richColors />
    </div>
  );
}
