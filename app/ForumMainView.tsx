"use client";

import { useState } from "react";
import {
  MessageSquare,
  ShieldCheck,
  Trash2,
  Edit2,
  Menu,
  CheckCircle2,
  Share2,
  Check,
} from "lucide-react";
import { Post } from "./types";
import { ReplyBox, ThreadItem } from "./ThreadComponents";
import { createClient } from "@/utils/supabase/client";

interface ForumMainViewProps {
  activePost: Post | undefined;
  isCreating: boolean;
  isInstructor: boolean;
  nickname: string;
  sessionId: string;
  lang: "en" | "jp";
  title: string;
  content: string;
  loading: boolean;
  onOpenMobile: () => void;
  onCancelCreate: () => void;
  onCreateSubmit: (e: React.FormEvent) => void;
  setTitle: (val: string) => void;
  setContent: (val: string) => void;
  onPromptDelete: (id: string, isReply: boolean) => void;
  onRefresh: () => void;
}

function hasInstructorReply(post: Post): boolean {
  if (post.is_instructor) return true;
  if (!post.replies || post.replies.length === 0) return false;
  return post.replies.some((reply) => hasInstructorReply(reply));
}

export function ForumMainView({
  activePost,
  isCreating,
  isInstructor,
  nickname,
  sessionId,
  lang,
  title,
  content,
  loading,
  onOpenMobile,
  onCancelCreate,
  onCreateSubmit,
  setTitle,
  setContent,
  onPromptDelete,
  onRefresh,
}: ForumMainViewProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const isAnsweredByInstructor = activePost
    ? hasInstructorReply(activePost)
    : false;
  const canModify =
    activePost &&
    (isInstructor ||
      (Boolean(sessionId) && activePost.session_id === sessionId));

  const startEditing = () => {
    if (!activePost) return;
    setEditTitle(activePost.title || "");
    setEditContent(activePost.content || "");
    setIsEditing(true);
  };

  const handleUpdateTopic = async () => {
    if (!activePost || !editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("posts")
      .update({
        title: editTitle.trim() || null,
        content: editContent,
      })
      .eq("id", activePost.id);

    if (!error) {
      setIsEditing(false);
      onRefresh();
    }
    setSaving(false);
  };

  const handleShare = async () => {
    if (!activePost) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${activePost.id}`;
    const shareTitle =
      activePost.title ||
      (lang === "en" ? "Forum Topic" : "フォーラムトピック");

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="sm:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
        <button
          onClick={onOpenMobile}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200/80 cursor-pointer"
        >
          <Menu size={16} /> {lang === "en" ? "Topics & Menu" : "トピック一覧"}
        </button>
        <span className="text-xs text-slate-500 truncate max-w-[150px]">
          {activePost?.title ||
            (lang === "en" ? "Discussions" : "ディスカッション")}
        </span>
      </div>

      {isCreating ? (
        <div className="p-4 sm:p-10 max-w-4xl mx-auto w-full overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-slate-800 flex items-center gap-2">
              <MessageSquare size={22} className="text-[#1f497c]" />
              {lang === "en"
                ? "Start a New Discussion"
                : "新しいトピックを開始"}
            </h2>
            <form onSubmit={onCreateSubmit} className="flex flex-col gap-5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  lang === "en" ? "Subject title..." : "件名・タイトル..."
                }
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:border-[#1f497c]"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  lang === "en" ? "Write details here..." : "本文を入力..."
                }
                rows={8}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:border-[#1f497c]"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancelCreate}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  {lang === "en" ? "Cancel" : "キャンセル"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1f497c] text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? lang === "en"
                      ? "Posting..."
                      : "投稿中..."
                    : lang === "en"
                      ? "Post Topic"
                      : "投稿する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : activePost ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
          <article
            id={`post-${activePost.id}`}
            className={`border rounded-2xl p-5 sm:p-7 shadow-sm transition-all duration-300 ${
              activePost.is_instructor
                ? "bg-amber-50/60 border-amber-200"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-200/60 pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {activePost.title ||
                      (lang === "en"
                        ? "Untitled Discussion"
                        : "無題のディスカッション")}
                  </h1>
                  {activePost.is_instructor && (
                    <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={14} />{" "}
                      {lang === "en" ? "INSTRUCTOR" : "講師"}
                    </span>
                  )}
                  {isAnsweredByInstructor && !activePost.is_instructor && (
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-emerald-700" />{" "}
                      {lang === "en" ? "INSTRUCTOR ANSWERED" : "講師回答済み"}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                  {lang === "en" ? "Posted by " : "投稿者: "}
                  <span className="font-semibold text-slate-800">
                    {activePost.author_name}
                  </span>{" "}
                  {lang === "en" ? "on " : " "}
                  {new Date(activePost.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-[#1f497c] px-2.5 py-1.5 text-xs font-medium transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                  title={lang === "en" ? "Share Topic" : "トピックを共有"}
                >
                  {copied ? (
                    <>
                      <Check size={15} className="text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">
                        {lang === "en" ? "Copied!" : "コピー完了!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      <span className="hidden sm:inline">
                        {lang === "en" ? "Share" : "共有"}
                      </span>
                    </>
                  )}
                </button>

                {canModify && !isEditing && (
                  <>
                    <button
                      onClick={startEditing}
                      className="text-slate-400 hover:text-blue-600 p-2 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={lang === "en" ? "Edit Topic" : "トピック編集"}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onPromptDelete(activePost.id, false)}
                      className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer"
                      title={lang === "en" ? "Delete Topic" : "トピック削除"}
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-base text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1f497c]"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full border border-slate-300 rounded-lg p-3 text-base text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1f497c]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    {lang === "en" ? "Cancel" : "キャンセル"}
                  </button>
                  <button
                    onClick={handleUpdateTopic}
                    disabled={saving}
                    className="px-4 py-2 bg-[#1f497c] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {saving
                      ? lang === "en"
                        ? "Saving..."
                        : "保存中..."
                      : lang === "en"
                        ? "Save Changes"
                        : "変更を保存"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-800 text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
                {activePost.content}
              </p>
            )}
          </article>

          <section className="space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {lang === "en" ? "Replies & Comments" : "返信・コメント"}
            </h3>

            <ReplyBox
              postId={activePost.id}
              targetPost={activePost}
              nickname={nickname}
              sessionId={sessionId}
              isInstructor={isInstructor}
              lang={lang}
              onRefresh={onRefresh}
            />

            <div className="space-y-4 pt-2">
              {activePost.replies?.map((reply) => (
                <ThreadItem
                  key={reply.id}
                  post={reply}
                  nickname={nickname}
                  sessionId={sessionId}
                  isInstructor={isInstructor}
                  lang={lang}
                  onRefresh={onRefresh}
                  onDelete={(id) => onPromptDelete(id, true)}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          {lang === "en"
            ? "Select a discussion topic from the sidebar to view thread."
            : "サイドバーからトピックを選択してください。"}
        </div>
      )}
    </div>
  );
}
