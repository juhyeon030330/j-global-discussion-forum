"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Post } from "./types";
import { ForumSidebar } from "./ForumSidebar";
import { ForumMainView } from "./ForumMainView";
import { ForumModals } from "./ForumModals";

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lang, setLang] = useState<"en" | "jp">("en");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
    isReply: boolean;
  }>({ isOpen: false, id: null, isReply: false });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const checkInstructorStatus = () => {
      setIsInstructor(localStorage.getItem("forum_is_instructor") === "true");
    };

    const checkLang = () => {
      const savedLang = localStorage.getItem("forum_lang") as "en" | "jp";
      if (savedLang) setLang(savedLang);
    };

    const savedName = localStorage.getItem("forum_nickname");
    if (savedName) setNickname(savedName);

    checkInstructorStatus();
    checkLang();
    fetchPosts();

    const handleOpenModal = () => setShowModal(true);

    window.addEventListener("open-instructor-modal", handleOpenModal);
    window.addEventListener("instructor-status-changed", checkInstructorStatus);
    window.addEventListener("lang-changed", checkLang);

    return () => {
      window.removeEventListener("open-instructor-modal", handleOpenModal);
      window.removeEventListener(
        "instructor-status-changed",
        checkInstructorStatus,
      );
      window.removeEventListener("lang-changed", checkLang);
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
      setPassError(
        lang === "en"
          ? "Incorrect password. Please try again."
          : "パスワードが正しくありません。再入力してください。",
      );
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
      nickname.trim() ||
      (isInstructor
        ? lang === "en"
          ? "Instructor"
          : "講師"
        : lang === "en"
          ? "Anonymous"
          : "匿名");

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
      alert(
        (lang === "en" ? "Failed to create post: " : "投稿に失敗しました: ") +
          error.message,
      );
    }
    setLoading(false);
  };

  const promptDelete = (id: string, isReply = false) => {
    if (!isInstructor) return;
    setDeleteModal({ isOpen: true, id, isReply });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    setDeleteModal({ isOpen: false, id: null, isReply: false });

    const { error } = await supabase.from("posts").delete().eq("id", targetId);
    if (!error) {
      if (selectedPostId === targetId) setSelectedPostId(null);
      fetchPosts();
    } else {
      alert(
        (lang === "en" ? "Error deleting post: " : "削除エラー: ") +
          error.message,
      );
    }
  };

  const postMatchesSearch = (post: Post, term: string): boolean => {
    const query = term.toLowerCase().trim();
    if (!query) return true;

    const matchesTitle = post.title?.toLowerCase().includes(query) ?? false;
    const matchesContent = post.content.toLowerCase().includes(query);
    if (matchesTitle || matchesContent) return true;

    if (post.replies && post.replies.length > 0) {
      return post.replies.some((reply) => postMatchesSearch(reply, term));
    }
    return false;
  };

  const filteredPosts = posts.filter((p) => postMatchesSearch(p, searchTerm));
  const activePost = posts.find((p) => p.id === selectedPostId);

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden text-slate-800 relative">
      <ForumSidebar
        posts={filteredPosts}
        selectedPostId={selectedPostId}
        searchTerm={searchTerm}
        nickname={nickname}
        isInstructor={isInstructor}
        isCreating={isCreating}
        mobileOpen={mobileOpen}
        lang={lang}
        onSelectPost={(id) => {
          setSelectedPostId(id);
          setIsCreating(false);
          setMobileOpen(false);
        }}
        onStartCreating={() => {
          setIsCreating(true);
          setMobileOpen(false);
        }}
        onSearchChange={setSearchTerm}
        onNicknameChange={handleNicknameChange}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <ForumMainView
        activePost={activePost}
        isCreating={isCreating}
        isInstructor={isInstructor}
        nickname={nickname}
        lang={lang}
        title={title}
        content={content}
        loading={loading}
        onOpenMobile={() => setMobileOpen(true)}
        onCancelCreate={() => setIsCreating(false)}
        onCreateSubmit={handleCreatePost}
        setTitle={setTitle}
        setContent={setContent}
        onPromptDelete={promptDelete}
        onRefresh={fetchPosts}
      />

      <ForumModals
        showModal={showModal}
        passcode={passcode}
        passError={passError}
        deleteModal={deleteModal}
        lang={lang}
        setPasscode={setPasscode}
        onCloseInstructorModal={() => setShowModal(false)}
        onInstructorLogin={handleInstructorLogin}
        onCloseDeleteModal={() =>
          setDeleteModal({ isOpen: false, id: null, isReply: false })
        }
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
