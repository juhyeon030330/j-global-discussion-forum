"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ShieldCheck,
  User,
  UserCheck,
  LogOut,
  Bell,
  CheckCheck,
} from "lucide-react";
import "./globals.css";
import { createClient } from "@/utils/supabase/client";
import { Notification } from "./types";

function HeaderControls() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [lang, setLang] = useState<"en" | "jp">("en");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch & Subscribe Notifications
  useEffect(() => {
    const checkStatus = () => {
      setIsInstructor(localStorage.getItem("forum_is_instructor") === "true");
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

  useEffect(() => {
    const currentSession = localStorage.getItem("forum_session_id");

    const fetchNotifications = async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .eq("is_read", false);

      if (isInstructor) {
        query = query.eq("target_role", "instructor");
      } else if (currentSession) {
        query = query.eq("user_session_id", currentSession);
      }

      const { data } = await query.order("created_at", { ascending: false });
      if (data) setNotifications(data as Notification[]);
    };

    fetchNotifications();

    const channel = supabase
      .channel("realtime_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          const userSession = localStorage.getItem("forum_session_id");

          if (
            (isInstructor && newNotif.target_role === "instructor") ||
            (!isInstructor && newNotif.user_session_id === userSession)
          ) {
            setNotifications((prev) => [newNotif, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInstructor]);

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

  const handleMarkAsRead = async (id: string, postId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setNotifOpen(false);

    // Dispatch event to switch active post
    window.dispatchEvent(new CustomEvent("navigate-post", { detail: postId }));
  };

  const handleMarkAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);
    setNotifications([]);
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

      {/* Notifications Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 relative cursor-pointer transition-colors"
          title={lang === "en" ? "Notifications" : "通知"}
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-100">
            <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">
                {lang === "en" ? "Notifications" : "通知"}{" "}
                <span className="text-slate-400 font-normal">
                  ({notifications.length})
                </span>
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <CheckCheck size={12} />
                  {lang === "en" ? "Clear all" : "すべて既読"}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 p-6 text-center">
                  {lang === "en"
                    ? "No new notifications"
                    : "新しい通知はありません"}
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.post_id)}
                    className="p-3 hover:bg-slate-50 cursor-pointer text-xs space-y-1 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">
                        {n.actor_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 md:px-8 shadow-sm">
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

          <HeaderControls />
        </header>

        <div className="flex-1 flex overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
