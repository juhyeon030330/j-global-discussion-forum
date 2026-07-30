"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CornerDownRight, Trash2, Edit2, ShieldCheck } from "lucide-react";
import { Post } from "./types";

export function ReplyBox({
  postId,
  targetPost,
  nickname,
  sessionId,
  isInstructor,
  lang,
  onRefresh,
}: {
  postId: string;
  targetPost?: Post;
  nickname: string;
  sessionId: string;
  isInstructor: boolean;
  lang: "en" | "jp";
  onRefresh: () => void;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setLoading(true);
    const author =
      nickname.trim() ||
      (isInstructor
        ? lang === "en"
          ? "Instructor"
          : "講師"
        : lang === "en"
          ? "Anonymous"
          : "匿名");

    const { data: newReply, error } = await supabase
      .from("posts")
      .insert({
        content: replyContent,
        author_name: author,
        session_id: sessionId,
        is_instructor: isInstructor,
        parent_id: postId,
      })
      .select()
      .single();

    if (!error && newReply) {
      const targetRole = targetPost?.is_instructor ? "instructor" : "user";
      const targetSessionId = isInstructor
        ? targetPost?.session_id || null
        : targetPost?.is_instructor
          ? null
          : targetPost?.session_id || null;

      // Make notification message descriptive by including a text snippet
      const contentSnippet =
        replyContent.length > 40
          ? replyContent.substring(0, 40) + "..."
          : replyContent;

      if (targetSessionId !== sessionId) {
        await supabase.from("notifications").insert({
          user_session_id: targetSessionId,
          target_role: targetRole,
          post_id: targetPost?.id || postId,
          actor_name: author,
          message:
            lang === "en"
              ? `${author}: "${contentSnippet}"`
              : `${author}: 「${contentSnippet}」`,
        });
      }

      setReplyContent("");
      onRefresh();
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSendReply}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
    >
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder={
          lang === "en"
            ? `Replying as ${
                nickname || (isInstructor ? "Instructor" : "Anonymous")
              }...`
            : `${nickname || (isInstructor ? "講師" : "匿名")} として返信...`
        }
        rows={3}
        required
        className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1f497c]"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1f497c] text-white text-xs font-semibold py-2 px-5 rounded-lg hover:bg-[#183961] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? lang === "en"
              ? "Sending..."
              : "送信中..."
            : lang === "en"
              ? "Post Reply"
              : "返信する"}
        </button>
      </div>
    </form>
  );
}

export function ThreadItem({
  post,
  nickname,
  sessionId,
  isInstructor,
  lang,
  onRefresh,
  onDelete,
}: {
  post: Post;
  nickname: string;
  sessionId: string;
  isInstructor: boolean;
  lang: "en" | "jp";
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const canModify =
    isInstructor || (Boolean(sessionId) && post.session_id === sessionId);

  const handleUpdateReply = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("posts")
      .update({ content: editContent })
      .eq("id", post.id);

    if (!error) {
      setIsEditing(false);
      onRefresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3 pl-3 sm:pl-6 border-l-2 border-slate-200">
      <div
        id={`post-${post.id}`}
        className={`border rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-300 ${
          post.is_instructor
            ? "bg-amber-50/60 border-amber-200"
            : "bg-white border-slate-200/80"
        }`}
      >
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">
              {post.author_name}
            </span>
            {post.is_instructor && (
              <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <ShieldCheck size={11} />{" "}
                {lang === "en" ? "INSTRUCTOR" : "講師"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {new Date(post.created_at).toLocaleString()}
            </span>

            {canModify && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded cursor-pointer"
                  title={lang === "en" ? "Edit Reply" : "返信編集"}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded cursor-pointer"
                  title={lang === "en" ? "Delete Reply" : "返信削除"}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1f497c]"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
              >
                {lang === "en" ? "Cancel" : "キャンセル"}
              </button>
              <button
                onClick={handleUpdateReply}
                disabled={saving}
                className="px-3 py-1 bg-[#1f497c] text-white rounded text-xs font-semibold"
              >
                {saving
                  ? lang === "en"
                    ? "Saving..."
                    : "保存中..."
                  : lang === "en"
                    ? "Save"
                    : "保存"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        )}

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="mt-3 text-xs font-semibold text-[#1f497c] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <CornerDownRight size={13} />
          {isReplying
            ? lang === "en"
              ? "Cancel"
              : "キャンセル"
            : lang === "en"
              ? "Reply"
              : "返信"}
        </button>

        {isReplying && (
          <div className="mt-3">
            <ReplyBox
              postId={post.id}
              targetPost={post}
              nickname={nickname}
              sessionId={sessionId}
              isInstructor={isInstructor}
              lang={lang}
              onRefresh={() => {
                setIsReplying(false);
                onRefresh();
              }}
            />
          </div>
        )}
      </div>

      {post.replies?.map((reply) => (
        <ThreadItem
          key={reply.id}
          post={reply}
          nickname={nickname}
          sessionId={sessionId}
          isInstructor={isInstructor}
          lang={lang}
          onRefresh={onRefresh}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
