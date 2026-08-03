"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  User,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Check,
  Settings,
  Tag,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Post } from "./types";

interface ForumSidebarProps {
  posts: Post[];
  selectedPostId: string | null;
  searchTerm: string;
  selectedTag: string | null;
  sortBy: "newest" | "oldest" | "replies";
  allTagsWithCounts: { tag: string; count: number }[];
  nickname: string;
  nicknameError: string;
  nicknameConfirmed: boolean;
  isInstructor: boolean;
  isCreating: boolean;
  mobileOpen: boolean;
  lang: "en" | "jp";
  onSelectPost: (id: string) => void;
  onStartCreating: () => void;
  onSearchChange: (val: string) => void;
  onTagSelect: (tag: string | null) => void;
  onSortChange: (sort: "newest" | "oldest" | "replies") => void;
  onNicknameChange: (val: string) => void;
  onClaimNickname: () => void;
  onOpenNicknameManager: () => void;
  onCloseMobile: () => void;
}

export function hasInstructorReply(post: Post): boolean {
  if (post.is_instructor) return true;
  if (!post.replies || post.replies.length === 0) return false;
  return post.replies.some((reply) => hasInstructorReply(reply));
}

export function ForumSidebar({
  posts,
  selectedPostId,
  searchTerm,
  selectedTag,
  sortBy,
  allTagsWithCounts,
  nickname,
  nicknameError,
  nicknameConfirmed,
  isInstructor,
  isCreating,
  mobileOpen,
  lang,
  onSelectPost,
  onStartCreating,
  onSearchChange,
  onTagSelect,
  onSortChange,
  onNicknameChange,
  onClaimNickname,
  onOpenNicknameManager,
  onCloseMobile,
}: ForumSidebarProps) {
  const [filterUnanswered, setFilterUnanswered] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  const visiblePosts = posts.filter((post) => {
    if (filterUnanswered && hasInstructorReply(post)) {
      return false;
    }
    return true;
  });

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
              placeholder={
                lang === "en" ? "Search posts or #tags..." : "検索..."
              }
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1f497c]/20"
            />
          </div>

          {/* Sort and Filter Row */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setFilterUnanswered(!filterUnanswered)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                filterUnanswered
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {lang === "en" ? "Needs Answer" : "未回答のみ"}
            </button>

            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as "newest" | "oldest" | "replies")
              }
              className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="newest">
                {lang === "en" ? "Newest" : "最新順"}
              </option>
              <option value="oldest">
                {lang === "en" ? "Oldest" : "古い順"}
              </option>
              <option value="replies">
                {lang === "en" ? "Most Replies" : "返信数順"}
              </option>
            </select>

            {isInstructor && (
              <button
                type="button"
                onClick={onOpenNicknameManager}
                className="text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                title={
                  lang === "en"
                    ? "Manage Reserved Nicknames"
                    : "使用中名前の管理"
                }
              >
                <Settings size={12} />
                {lang === "en" ? "Names" : "名前管理"}
              </button>
            )}
          </div>

          {/* Tag Selector Drawer */}
          {allTagsWithCounts.length > 0 && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowAllTags(!showAllTags)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer pt-1"
              >
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {lang === "en" ? "Browse Tags" : "タグで絞り込み"} (
                  {allTagsWithCounts.length})
                </span>
                {showAllTags ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </button>

              {showAllTags && (
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg shadow-inner">
                  {allTagsWithCounts.map(({ tag, count }) => {
                    const isSelected = selectedTag?.toLowerCase() === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => onTagSelect(isSelected ? null : tag)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#1f497c] text-white font-bold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        #{tag}
                        <span className="opacity-60 text-[9px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active Tag Filter Indicator */}
          {selectedTag && (
            <div className="flex items-center justify-between bg-[#1f497c]/10 border border-[#1f497c]/20 rounded-lg px-2 py-1 text-[11px] text-[#1f497c] font-semibold">
              <span className="flex items-center gap-1 truncate">
                <Tag size={12} /> Filtering: #{selectedTag}
              </span>
              <button
                onClick={() => onTagSelect(null)}
                className="hover:text-red-500 cursor-pointer ml-1"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          {/* Clean Nickname Header */}
          <div className="pt-1 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <User size={13} className="text-[#1f497c] shrink-0" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => onNicknameChange(e.target.value)}
                  placeholder={lang === "en" ? "Display Name..." : "表示名..."}
                  className={`w-full border rounded px-2 py-1 text-xs bg-white focus:outline-none ${
                    nicknameError
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-200 focus:border-[#1f497c]"
                  }`}
                />
              </div>

              {nickname.trim() && (
                <button
                  type="button"
                  onClick={onClaimNickname}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded cursor-pointer shrink-0"
                >
                  {lang === "en" ? "Claim" : "確定"}
                </button>
              )}

              {isInstructor && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                  <ShieldCheck size={11} /> {lang === "en" ? "Inst." : "講師"}
                </span>
              )}
            </div>

            {nicknameError && (
              <p className="text-[10px] text-red-500 flex items-center gap-1 pl-5">
                <AlertCircle size={11} /> {nicknameError}
              </p>
            )}

            {nicknameConfirmed && !nicknameError && (
              <p className="text-[10px] text-emerald-600 flex items-center gap-1 pl-5 font-semibold">
                <Check size={11} />{" "}
                {lang === "en"
                  ? `Claimed name "${nickname}"`
                  : `"${nickname}" を確保しました`}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {visiblePosts.map((post) => {
            const isSelected = post.id === selectedPostId && !isCreating;
            const isAnsweredByInstructor = hasInstructorReply(post);

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

                {/* Render Tag Chips */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagSelect(tag);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${
                          selectedTag === tag
                            ? "bg-[#1f497c] text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-medium text-slate-600 truncate max-w-[110px]">
                    {post.author_name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isAnsweredByInstructor && (
                      <span
                        className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0"
                        title={
                          lang === "en" ? "Instructor Answered" : "講師回答済み"
                        }
                      >
                        <CheckCircle2 size={10} />
                        {lang === "en" ? "Answered" : "回答済"}
                      </span>
                    )}

                    <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">
                      {post.replies?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
