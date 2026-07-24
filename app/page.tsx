"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  MessageSquare,
  CornerDownRight,
  Trash2,
  User,
  Plus,
  Search,
  ShieldCheck,
  X,
  Menu,
} from "lucide-react";

type Post = {
  id: string;
  title: string | null;
  content: string;
  author_name: string;
  is_instructor?: boolean;
  created_at: string;
  parent_id: string | null;
  replies?: Post[];
};

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mobile Sidebar Drawer State
  const [mobileOpen, setMobileOpen] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const checkInstructorStatus = () => {
      const savedInstructor = localStorage.getItem("forum_is_instructor");
      setIsInstructor(savedInstructor === "true");
    };

    const savedName = localStorage.getItem("forum_nickname");
    if (savedName) setNickname(savedName);

    checkInstructorStatus();
    fetchPosts();

    const handleOpenModal = () => setShowModal(true);

    window.addEventListener("open-instructor-modal", handleOpenModal);
    window.addEventListener("instructor-status-changed", checkInstructorStatus);

    return () => {
      window.removeEventListener("open-instructor-modal", handleOpenModal);
      window.removeEventListener(
        "instructor-status-changed",
        checkInstructorStatus,
      );
    };
  }, []);

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    localStorage.setItem("forum_nickname", val);
  };

  const handleInstructorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "jglobal1414") {
      setIsInstructor(true);
      localStorage.setItem("forum_is_instructor", "true");
      window.dispatchEvent(new CustomEvent("instructor-status-changed"));
      setShowModal(false);
      setPasscode("");
      setPassError("");
    } else {
      setPassError("Incorrect password. Please try again.");
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      const tree = buildThreadTree(data as Post[]);
      setPosts(tree);
      if (tree.length > 0 && !selectedPostId) {
        setSelectedPostId(tree[0].id);
      }
    }
  };

  const buildThreadTree = (postsList: Post[]): Post[] => {
    const postMap = new Map<string, Post>();
    const roots: Post[] = [];

    postsList.forEach((p) => postMap.set(p.id, { ...p, replies: [] }));
    postsList.forEach((p) => {
      const node = postMap.get(p.id)!;
      if (p.parent_id && postMap.has(p.parent_id)) {
        postMap.get(p.parent_id)!.replies!.push(node);
      } else if (!p.parent_id) {
        roots.push(node);
      }
    });

    return roots.reverse();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const author =
      nickname.trim() || (isInstructor ? "Instructor" : "Anonymous");

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: title.trim() || null,
        content,
        author_name: author,
        is_instructor: isInstructor,
        parent_id: null,
      })
      .select();

    if (!error) {
      setTitle("");
      setContent("");
      setIsCreating(false);
      await fetchPosts();
      if (data && data[0]) setSelectedPostId(data[0].id);
    } else {
      alert("Failed to create post: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, isReply = false) => {
    if (!isInstructor) return;

    const confirmMessage = isReply
      ? "Are you sure you want to delete this reply?"
      : "Are you sure you want to delete this discussion topic and all of its replies?";

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) {
      if (selectedPostId === id) setSelectedPostId(null);
      fetchPosts();
    } else {
      alert("Error deleting post: " + error.message);
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activePost = posts.find((p) => p.id === selectedPostId);

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden text-slate-800 relative">
      {/* ==================== MOBILE BACKDROP OVERLAY ==================== */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 sm:hidden transition-opacity"
        />
      )}

      {/* ==================== LEFT SIDEBAR (DRAWER ON MOBILE, FIXED ON DESKTOP) ==================== */}
      <aside
        className={`fixed sm:relative z-40 sm:z-auto inset-y-0 left-0 w-72 sm:w-84 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsCreating(true);
                setMobileOpen(false);
              }}
              className="w-full bg-[#1f497c] hover:bg-[#183961] text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition-all"
            >
              <Plus size={15} /> Start New Topic
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="sm:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1f497c]/20"
            />
          </div>

          {/* Nickname & Instructor Badge */}
          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <User size={13} className="text-[#1f497c] shrink-0" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Display Name..."
                className="w-full border border-slate-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#1f497c]"
              />
            </div>
            {isInstructor && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <ShieldCheck size={11} /> Inst.
              </span>
            )}
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredPosts.map((post) => {
            const isSelected = post.id === selectedPostId && !isCreating;
            return (
              <div
                key={post.id}
                onClick={() => {
                  setSelectedPostId(post.id);
                  setIsCreating(false);
                  setMobileOpen(false); // Close sidebar on mobile item tap
                }}
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
                    {post.title || "Untitled Topic"}
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

      {/* ==================== RIGHT PANEL ==================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Mobile Top Navigation Bar for opening topics sidebar */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200/80"
          >
            <Menu size={16} /> Topics & Menu
          </button>
          <span className="text-xs text-slate-500 truncate max-w-[150px]">
            {activePost?.title || "Discussions"}
          </span>
        </div>

        {isCreating ? (
          <div className="p-4 sm:p-10 max-w-4xl mx-auto w-full overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-5 text-slate-800 flex items-center gap-2">
                <MessageSquare size={22} className="text-[#1f497c]" />
                Start a New Discussion
              </h2>
              <form onSubmit={handleCreatePost} className="flex flex-col gap-5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subject title..."
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:border-[#1f497c]"
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write details here..."
                  rows={8}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base focus:outline-none focus:border-[#1f497c]"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1f497c] text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow-sm"
                  >
                    {loading ? "Posting..." : "Post Topic"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activePost ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
            {/* Main Thread Article Card */}
            <article
              className={`border rounded-2xl p-5 sm:p-7 shadow-sm transition-all ${
                activePost.is_instructor
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-4 border-b border-slate-200/60 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {activePost.title || "Untitled Discussion"}
                    </h1>
                    {activePost.is_instructor && (
                      <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck size={14} /> INSTRUCTOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                    Posted by{" "}
                    <span className="font-semibold text-slate-800">
                      {activePost.author_name}
                    </span>{" "}
                    on {new Date(activePost.created_at).toLocaleString()}
                  </p>
                </div>

                {isInstructor && (
                  <button
                    onClick={() => handleDelete(activePost.id, false)}
                    className="text-slate-400 hover:text-red-500 p-2 transition-colors rounded-lg hover:bg-slate-100"
                    title="Delete Topic"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <p className="text-slate-800 text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
                {activePost.content}
              </p>
            </article>

            {/* Replies Section */}
            <section className="space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Replies & Comments
              </h3>

              <ReplyBox
                postId={activePost.id}
                nickname={nickname}
                isInstructor={isInstructor}
                onRefresh={fetchPosts}
              />

              <div className="space-y-4 pt-2">
                {activePost.replies?.map((reply) => (
                  <ThreadItem
                    key={reply.id}
                    post={reply}
                    nickname={nickname}
                    isInstructor={isInstructor}
                    onRefresh={fetchPosts}
                    onDelete={(id) => handleDelete(id, true)}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a discussion topic from the sidebar to view thread.
          </div>
        )}
      </main>

      {/* ==================== INSTRUCTOR MODAL ==================== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                Instructor Verification
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInstructorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Instructor Passcode
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
                {passError && (
                  <p className="text-[11px] text-red-500 mt-1">{passError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl text-xs transition-colors shadow-sm"
              >
                Claim Instructor Status
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyBox({
  postId,
  nickname,
  isInstructor,
  onRefresh,
}: {
  postId: string;
  nickname: string;
  isInstructor: boolean;
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
      nickname.trim() || (isInstructor ? "Instructor" : "Anonymous");

    const { error } = await supabase.from("posts").insert({
      content: replyContent,
      author_name: author,
      is_instructor: isInstructor,
      parent_id: postId,
    });

    if (!error) {
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
        placeholder={`Replying as ${nickname || (isInstructor ? "Instructor" : "Anonymous")}...`}
        rows={3}
        required
        className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1f497c]"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1f497c] text-white text-xs font-semibold py-2 px-5 rounded-lg hover:bg-[#183961] transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Post Reply"}
        </button>
      </div>
    </form>
  );
}

function ThreadItem({
  post,
  nickname,
  isInstructor,
  onRefresh,
  onDelete,
}: {
  post: Post;
  nickname: string;
  isInstructor: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className="space-y-3 pl-3 sm:pl-6 border-l-2 border-slate-200">
      <div
        className={`border rounded-xl p-4 sm:p-5 shadow-sm transition-all ${
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
                <ShieldCheck size={11} /> INSTRUCTOR
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400">
              {new Date(post.created_at).toLocaleString()}
            </span>

            {isInstructor && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                title="Delete Reply"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>

        <button
          onClick={() => setIsReplying(!isReplying)}
          className="mt-3 text-xs font-semibold text-[#1f497c] hover:underline flex items-center gap-1"
        >
          <CornerDownRight size={13} />
          {isReplying ? "Cancel" : "Reply"}
        </button>

        {isReplying && (
          <div className="mt-3">
            <ReplyBox
              postId={post.id}
              nickname={nickname}
              isInstructor={isInstructor}
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
          isInstructor={isInstructor}
          onRefresh={onRefresh}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
