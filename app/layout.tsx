"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ShieldCheck,
  User,
  UserCheck,
  LogOut,
} from "lucide-react";
import "./globals.css";

function HeaderControls() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [lang, setLang] = useState<"en" | "jp">("en");

  useEffect(() => {
    const checkStatus = () => {
      const status = localStorage.getItem("forum_is_instructor") === "true";
      setIsInstructor(status);
    };

    const checkLang = () => {
      const savedLang = localStorage.getItem("forum_lang") as "en" | "jp";
      if (savedLang) setLang(savedLang);
    };

    checkStatus();
    checkLang();

    window.addEventListener("instructor-status-changed", checkStatus);
    window.addEventListener("lang-changed", checkLang);

    return () => {
      window.removeEventListener("instructor-status-changed", checkStatus);
      window.removeEventListener("lang-changed", checkLang);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("forum_is_instructor");
    setIsInstructor(false);
    setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("instructor-status-changed"));
  };

  const handleSetLang = (targetLang: "en" | "jp") => {
    if (lang === targetLang) return;
    setLang(targetLang);
    localStorage.setItem("forum_lang", targetLang);
    window.dispatchEvent(new CustomEvent("lang-changed"));
  };

  return (
    <div className="flex items-center gap-3 md:gap-4 shrink-0 relative">
      {/* Breadcrumbs */}
      <div className="hidden sm:flex items-center text-xs font-bold text-slate-700 leading-none h-5 mr-2">
        <span className="inline-block tracking-tight">
          {lang === "en" ? "Dashboard" : "ダッシュボード"}
        </span>
        <span className="mx-2 text-slate-300 font-normal">/</span>
        <span className="inline-block text-slate-900 tracking-tight">
          {lang === "en" ? "Forum" : "フォーラム"}
        </span>
      </div>

      {/* Language Switcher */}
      <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 text-xs font-semibold select-none">
        <button
          type="button"
          onClick={() => handleSetLang("en")}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            lang === "en"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => handleSetLang("jp")}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
            lang === "jp"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          JP
        </button>
      </div>

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex items-center gap-1.5 p-1.5 rounded-full border transition-all cursor-pointer ${
            isInstructor
              ? "bg-amber-50 border-amber-300 hover:bg-amber-100/70"
              : "bg-slate-100 border-slate-200/80 hover:bg-slate-200/70"
          }`}
          aria-label="Open menu"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isInstructor
                ? "bg-amber-100 text-amber-700 font-bold"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {isInstructor ? (
              <UserCheck size={18} className="text-amber-700" />
            ) : (
              <User size={18} />
            )}
          </div>
          <ChevronDown
            size={14}
            className={`${
              isInstructor ? "text-amber-700" : "text-slate-500"
            } mr-0.5 shrink-0`}
          />
        </button>

        {/* Dropdown Menu Options */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            {isInstructor ? (
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                {lang === "en" ? "Logout (Instructor)" : "ログアウト (講師)"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("open-instructor-modal"),
                  );
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck size={16} className="text-slate-500" />
                {lang === "en" ? "Instructor Login" : "講師ログイン"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </div>

          {/* RIGHT SIDE CLIENT CONTROLS */}
          <HeaderControls />
        </header>

        {/* MAIN PAGE CONTENT WRAPPER (Removed duplicate <main> tag) */}
        <div className="flex-1 flex overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
