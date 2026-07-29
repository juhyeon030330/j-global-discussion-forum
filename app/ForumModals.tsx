"use client";

import { ShieldCheck, X, AlertTriangle } from "lucide-react";

interface ModalsProps {
  showModal: boolean;
  passcode: string;
  passError: string;
  deleteModal: { isOpen: boolean; id: string | null; isReply: boolean };
  lang: "en" | "jp";
  setPasscode: (val: string) => void;
  onCloseInstructorModal: () => void;
  onInstructorLogin: (e: React.FormEvent) => void;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
}

export function ForumModals({
  showModal,
  passcode,
  passError,
  deleteModal,
  lang,
  setPasscode,
  onCloseInstructorModal,
  onInstructorLogin,
  onCloseDeleteModal,
  onConfirmDelete,
}: ModalsProps) {
  return (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                {lang === "en" ? "Instructor Verification" : "講師認証"}
              </h3>
              <button
                onClick={onCloseInstructorModal}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={onInstructorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {lang === "en" ? "Instructor Passcode" : "講師パスコード"}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder={
                    lang === "en" ? "Enter passcode..." : "パスコードを入力..."
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
                {passError && (
                  <p className="text-[11px] text-red-500 mt-1">{passError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                {lang === "en" ? "Claim Instructor Status" : "講師権限を取得"}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === "en" ? "Confirm Deletion" : "削除の確認"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {deleteModal.isReply
                    ? lang === "en"
                      ? "Are you sure you want to delete this reply?"
                      : "この返信を削除してもよろしいですか？"
                    : lang === "en"
                      ? "Are you sure you want to delete this discussion topic and all of its replies?"
                      : "このトピックとすべての返信を削除してもよろしいですか？"}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onCloseDeleteModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "キャンセル"}
              </button>
              <button
                onClick={onConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                {lang === "en" ? "Delete" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
