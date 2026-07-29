"use client";

import { Plus, Search, User, ShieldCheck, X } from "lucide-react";
import { Post } from "./types";

interface ForumSidebarProps {
  posts: Post[];
  selectedPostId: string | null;
  searchTerm: string;
  nickname: string;
  isInstructor: boolean;
  isCreating: boolean;
  mobileOpen: boolean;
  lang: "en" | "jp";
  onSelectPost: (id: string) => void;
  onStartCreating: () => void;
  onSearchChange: (val: string) => void;
  onNicknameChange: (val: string) => void;
  onCloseMobile: () => void;
}

export function ForumSidebar({
  posts,
  selectedPostId,
  searchTerm,
  nickname,
  isInstructor,
  isCreating,
  mobileOpen,
  lang,
  onSelectPost,
  onStartCreating,
  onSearchChange,
  onNicknameChange,
  onCloseMobile,
}: ForumSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 sm:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed sm:relative z-40 sm:z-auto inset-y-0 left-0 w-72 sm:w-84 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onStartCreating}
              className="w-full bg-[#1f497c] hover:bg-[#183961] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus size={15} />{" "}
              {lang === "en" ? "Start New Topic" : "新規トピック作成"}
            </button>
            <button
              onClick={onCloseMobile}
              className="sm:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder={lang === "en" ? "Search..." : "検索..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1f497c]/20"
            />
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <User size={13} className="text-[#1f497c] shrink-0" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                placeholder={lang === "en" ? "Display Name..." : "表示名..."}
                className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#1f497c]"
              />
            </div>
            {isInstructor && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <ShieldCheck size={11} /> {lang === "en" ? "Inst." : "講師"}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {posts.map((post) => {
            const isSelected = post.id === selectedPostId && !isCreating;
            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post.id)}
                className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                  isSelected
                    ? post.is_instructor
                      ? "bg-amber-50/80 border-amber-500"
                      : "bg-slate-50 border-[#1f497c]"
                    : post.is_instructor
                      ? "bg-amber-50/40 border-transparent hover:bg-amber-50/70"
                      : "border-transparent hover:bg-slate-50/60"
                }`}
              >
                <div className="flex justify-between items-start gap-1.5 mb-1">
                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-1 flex items-center gap-1">
                    {post.is_instructor && (
                      <ShieldCheck
                        size={13}
                        className="text-amber-600 inline shrink-0"
                      />
                    )}
                    {post.title ||
                      (lang === "en" ? "Untitled Topic" : "無題のトピック")}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-1.5">
                  {post.content}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-medium text-slate-600 truncate">
                    {post.author_name}
                  </span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">
                    {post.replies?.length || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
