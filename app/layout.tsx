"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ShieldCheck, User, LogOut } from "lucide-react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const status = localStorage.getItem("forum_is_instructor") === "true";
      setIsInstructor(status);
    };

    checkStatus();

    window.addEventListener("instructor-status-changed", checkStatus);
    return () =>
      window.removeEventListener("instructor-status-changed", checkStatus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("forum_is_instructor");
    setIsInstructor(false);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("instructor-status-changed"));
  };

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 flex flex-col antialiased font-sans overflow-hidden">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 md:px-8 shadow-sm">
          {/* LEFT SIDE CONTENT */}
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="flex items-center justify-center shrink-0"
            >
              <Image
                src="/icon2.png"
                alt="Logo"
                width={120}
                height={48}
                className="h-16 w-auto object-contain"
                priority
              />
            </Link>

            <div className="hidden sm:flex items-center text-sm font-semibold text-slate-700">
              <span>Dashboard</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-bold text-slate-900">Forum</span>
            </div>
          </div>

          {/* RIGHT SIDE CONTENT */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0 relative">
            <div className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg border border-slate-200/60">
              EN
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100 border border-slate-200/80 hover:bg-slate-200/70 focus:outline-none transition-all cursor-pointer"
                aria-label="Open menu"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  {/* Standard anonymous User icon instead of UserCheck */}
                  <User size={18} />
                </div>
                <ChevronDown
                  size={14}
                  className="text-slate-500 mr-0.5 shrink-0"
                />
              </button>

              {/* Dropdown Menu Options */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {isInstructor ? (
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout (Instructor)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.dispatchEvent(
                          new CustomEvent("open-instructor-modal"),
                        );
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck size={16} className="text-slate-500" />
                      Instructor Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN PAGE CONTENT */}
        <main className="flex-1 flex overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
