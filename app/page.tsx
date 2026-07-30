"use client";

import { Suspense } from "react";
import { ForumSidebar } from "./ForumSidebar";
import { ForumMainView } from "./ForumMainView";
import { ForumModals } from "./ForumModals";
import { useForumState } from "./useForumState";

function ForumContent() {
  const state = useForumState();

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden text-slate-800 relative">
      <ForumSidebar
        posts={state.posts}
        selectedPostId={state.selectedPostId}
        searchTerm={state.searchTerm}
        nickname={state.nickname}
        nicknameError={state.nicknameError}
        nicknameConfirmed={state.nicknameConfirmed}
        isInstructor={state.isInstructor}
        isCreating={state.isCreating}
        mobileOpen={state.mobileOpen}
        lang={state.lang}
        onSelectPost={state.handleSelectPost}
        onStartCreating={() => {
          state.setIsCreating(true);
          state.setMobileOpen(false);
        }}
        onSearchChange={state.setSearchTerm}
        onNicknameChange={state.handleNicknameChange}
        onClaimNickname={state.handleClaimNickname}
        onOpenNicknameManager={() => state.setShowNicknameManager(true)}
        onCloseMobile={() => state.setMobileOpen(false)}
      />

      <ForumMainView
        activePost={state.activePost}
        isCreating={state.isCreating}
        isInstructor={state.isInstructor}
        nickname={state.nickname}
        sessionId={state.sessionId}
        lang={state.lang}
        title={state.title}
        content={state.content}
        loading={state.loading}
        onOpenMobile={() => state.setMobileOpen(true)}
        onCancelCreate={() => state.setIsCreating(false)}
        onCreateSubmit={state.handleCreatePost}
        setTitle={state.setTitle}
        setContent={state.setContent}
        onPromptDelete={state.promptDelete}
        onRefresh={state.fetchPosts}
      />

      <ForumModals
        showModal={state.showModal}
        passcode={state.passcode}
        passError={state.passError}
        deleteModal={state.deleteModal}
        showNicknameManager={state.showNicknameManager}
        lang={state.lang}
        setPasscode={state.setPasscode}
        onCloseInstructorModal={() => state.setShowModal(false)}
        onInstructorLogin={state.handleInstructorLogin}
        onCloseDeleteModal={() =>
          state.setDeleteModal({ isOpen: false, id: null, isReply: false })
        }
        onConfirmDelete={state.confirmDelete}
        onCloseNicknameManager={() => state.setShowNicknameManager(false)}
      />
    </div>
  );
}

export default function ForumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center h-full text-slate-400 text-sm">
          Loading forum...
        </div>
      }
    >
      <ForumContent />
    </Suspense>
  );
}
