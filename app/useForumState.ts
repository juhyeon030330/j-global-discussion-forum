"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Post } from "./types";

export type SortOption = "newest" | "oldest" | "replies";

export function useForumState() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [nicknameError, setNicknameError] = useState<string>("");
  const [nicknameConfirmed, setNicknameConfirmed] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [lang, setLang] = useState<"en" | "jp">("en");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showNicknameManager, setShowNicknameManager] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
    isReply: boolean;
  }>({ isOpen: false, id: null, isReply: false });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Extract all unique existing tags across all posts with frequency count
  const allTagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const traverse = (nodeList: Post[]) => {
      nodeList.forEach((p) => {
        p.tags?.forEach((t) => {
          const lower = t.toLowerCase().trim();
          if (lower) counts[lower] = (counts[lower] || 0) + 1;
        });
        if (p.replies) traverse(p.replies);
      });
    };
    traverse(posts);
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [posts]);

  const allTags = useMemo(
    () => allTagsWithCounts.map((item) => item.tag),
    [allTagsWithCounts],
  );

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

  const findRootPostId = useCallback(
    (tree: Post[], targetId: string): string | null => {
      for (const rootPost of tree) {
        const containsPost = (node: Post, id: string): boolean => {
          if (node.id === id) return true;
          return node.replies?.some((r) => containsPost(r, id)) ?? false;
        };
        if (containsPost(rootPost, targetId)) {
          return rootPost.id;
        }
      }
      return null;
    },
    [],
  );

  const fetchPosts = useCallback(async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      const tree = buildThreadTree(data as Post[]);
      setPosts(tree);

      const urlPostId = searchParams.get("post");
      if (urlPostId) {
        const rootId = findRootPostId(tree, urlPostId);
        if (rootId) setSelectedPostId(rootId);
      } else if (tree.length > 0 && !selectedPostId) {
        setSelectedPostId(tree[0].id);
      }
      return tree;
    }
    return [];
  }, [supabase, searchParams, selectedPostId, findRootPostId]);

  useEffect(() => {
    let currentSession = localStorage.getItem("forum_session_id");
    if (!currentSession) {
      currentSession =
        "sess_" +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      localStorage.setItem("forum_session_id", currentSession);
    }
    setSessionId(currentSession);

    const savedName = localStorage.getItem("forum_nickname");
    if (savedName) setNickname(savedName);

    const checkInstructorStatus = () => {
      setIsInstructor(localStorage.getItem("forum_is_instructor") === "true");
    };

    const checkLang = () => {
      const savedLang = localStorage.getItem("forum_lang") as "en" | "jp";
      if (savedLang) setLang(savedLang);
    };

    checkInstructorStatus();
    checkLang();
    fetchPosts();

    const handleOpenModal = () => setShowModal(true);

    const handleNavigatePost = async (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetId = customEvent.detail;
      if (!targetId) return;

      const freshTree = await fetchPosts();
      const treeToUse = freshTree.length > 0 ? freshTree : posts;
      const rootId = findRootPostId(treeToUse, targetId) || targetId;

      setSelectedPostId(rootId);
      setIsCreating(false);
      setMobileOpen(false);
      router.push(`?post=${rootId}`, { scroll: false });

      setTimeout(() => {
        requestAnimationFrame(() => {
          const element = document.getElementById(`post-${targetId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add(
              "ring-2",
              "ring-amber-400",
              "bg-amber-100/50",
            );

            setTimeout(() => {
              element.classList.remove(
                "ring-2",
                "ring-amber-400",
                "bg-amber-100/50",
              );
            }, 2500);
          }
        });
      }, 350);
    };

    window.addEventListener("open-instructor-modal", handleOpenModal);
    window.addEventListener("instructor-status-changed", checkInstructorStatus);
    window.addEventListener("lang-changed", checkLang);
    window.addEventListener("navigate-post", handleNavigatePost);

    return () => {
      window.removeEventListener("open-instructor-modal", handleOpenModal);
      window.removeEventListener(
        "instructor-status-changed",
        checkInstructorStatus,
      );
      window.removeEventListener("lang-changed", checkLang);
      window.removeEventListener("navigate-post", handleNavigatePost);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const urlPostId = searchParams.get("post");
    if (urlPostId && posts.length > 0) {
      const rootId = findRootPostId(posts, urlPostId) || urlPostId;
      if (rootId !== selectedPostId) {
        setSelectedPostId(rootId);
      }
    }
  }, [searchParams, posts, findRootPostId, selectedPostId]);

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    setNicknameError("");
    setNicknameConfirmed(false);

    if (!val.trim()) {
      localStorage.removeItem("forum_nickname");
    }
  };

  const handleClaimNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;

    const { data } = await supabase
      .from("reserved_nicknames")
      .select("session_id")
      .eq("nickname", trimmed)
      .maybeSingle();

    if (data && data.session_id !== sessionId) {
      setNicknameError(
        lang === "en"
          ? "Nickname is currently in use by another user"
          : "この表示名は別のユーザーによって使用されています",
      );
      setNicknameConfirmed(false);
    } else {
      await supabase.from("reserved_nicknames").upsert({
        nickname: trimmed,
        session_id: sessionId,
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem("forum_nickname", trimmed);
      setNicknameError("");
      setNicknameConfirmed(true);
      setTimeout(() => setNicknameConfirmed(false), 3000);
    }
  };

  const handleSelectPost = (id: string) => {
    const rootId = findRootPostId(posts, id) || id;
    setSelectedPostId(rootId);
    setIsCreating(false);
    setMobileOpen(false);
    router.push(`?post=${rootId}`, { scroll: false });
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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || nicknameError) return;

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
        session_id: sessionId,
        is_instructor: isInstructor,
        parent_id: null,
        tags: tags.map((t) => t.toLowerCase().trim()),
      })
      .select();

    if (!error) {
      setTitle("");
      setContent("");
      setTags([]);
      setIsCreating(false);
      await fetchPosts();
      if (data && data[0]) handleSelectPost(data[0].id);
    } else {
      alert(
        (lang === "en" ? "Failed to create post: " : "投稿に失敗しました: ") +
          error.message,
      );
    }
    setLoading(false);
  };

  const findPostById = (list: Post[], targetId: string): Post | null => {
    for (const p of list) {
      if (p.id === targetId) return p;
      if (p.replies) {
        const found = findPostById(p.replies, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const promptDelete = (id: string) => {
    const postToDelete = findPostById(posts, id);
    if (
      !isInstructor &&
      (!sessionId || postToDelete?.session_id !== sessionId)
    ) {
      return;
    }
    setDeleteModal({
      isOpen: true,
      id,
      isReply: Boolean(postToDelete?.parent_id),
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    setDeleteModal({ isOpen: false, id: null, isReply: false });

    const { error } = await supabase.from("posts").delete().eq("id", targetId);
    if (!error) {
      if (selectedPostId === targetId) {
        const remaining = posts.filter((p) => p.id !== targetId);
        const nextSelected = remaining.length > 0 ? remaining[0].id : null;
        setSelectedPostId(nextSelected);
        if (nextSelected) {
          router.push(`?post=${nextSelected}`, { scroll: false });
        } else {
          router.push(window.location.pathname, { scroll: false });
        }
      }
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
    const matchesTag =
      post.tags?.some((t) => t.toLowerCase().includes(query)) ?? false;
    if (matchesTitle || matchesContent || matchesTag) return true;

    if (post.replies && post.replies.length > 0) {
      return post.replies.some((reply) => postMatchesSearch(reply, term));
    }
    return false;
  };

  const filteredPosts = posts
    .filter((p) => {
      const matchesSearch = postMatchesSearch(p, searchTerm);
      const matchesTag = selectedTag
        ? p.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
        : true;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      if (sortBy === "replies") {
        return (b.replies?.length || 0) - (a.replies?.length || 0);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const activePost = posts.find((p) => p.id === selectedPostId);

  return {
    posts: filteredPosts,
    activePost,
    selectedPostId,
    searchTerm,
    selectedTag,
    sortBy,
    allTags,
    allTagsWithCounts,
    nickname,
    nicknameError,
    nicknameConfirmed,
    sessionId,
    isInstructor,
    isCreating,
    mobileOpen,
    lang,
    showModal,
    showNicknameManager,
    passcode,
    passError,
    deleteModal,
    title,
    content,
    tags,
    loading,
    setSearchTerm,
    setSelectedTag,
    setSortBy,
    setIsCreating,
    setMobileOpen,
    setShowModal,
    setShowNicknameManager,
    setPasscode,
    setDeleteModal,
    setTitle,
    setContent,
    setTags,
    fetchPosts,
    handleNicknameChange,
    handleClaimNickname,
    handleSelectPost,
    handleInstructorLogin,
    handleCreatePost,
    promptDelete,
    confirmDelete,
  };
}
