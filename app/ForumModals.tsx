"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  X,
  AlertTriangle,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ReservedNickname {
  nickname: string;
  session_id: string;
  updated_at: string;
}

interface ModalsProps {
  showModal: boolean;
  passcode: string;
  passError: string;
  deleteModal: { isOpen: boolean; id: string | null; isReply: boolean };
  showNicknameManager: boolean;
  lang: "en" | "jp";
  setPasscode: (val: string) => void;
  onCloseInstructorModal: () => void;
  onInstructorLogin: (e: React.FormEvent) => void;
  onCloseDeleteModal: () => void;
  onConfirmDelete: () => void;
  onCloseNicknameManager: () => void;
}

export function ForumModals({
  showModal,
  passcode,
  passError,
  deleteModal,
  showNicknameManager,
  lang,
  setPasscode,
  onCloseInstructorModal,
  onInstructorLogin,
  onCloseDeleteModal,
  onConfirmDelete,
  onCloseNicknameManager,
}: ModalsProps) {
  const [reservedNames, setReservedNames] = useState<ReservedNickname[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const supabase = createClient();

  const fetchReservedNicknames = async () => {
    setLoadingNames(true);
    const { data } = await supabase
      .from("reserved_nicknames")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setReservedNames(data as ReservedNickname[]);
    }
    setLoadingNames(false);
  };

  useEffect(() => {
    if (showNicknameManager) {
      fetchReservedNicknames();
    }
  }, [showNicknameManager]);

  const handleReleaseNickname = async (nameToRelease: string) => {
    const { error } = await supabase
      .from("reserved_nicknames")
      .delete()
      .eq("nickname", nameToRelease);

    if (!error) {
      setReservedNames((prev) =>
        prev.filter((item) => item.nickname !== nameToRelease),
      );
    }
  };

  return (
    <>
      {/* Instructor Login Modal */}
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

      {/* Instructor Nickname Management Modal */}
      {showNicknameManager && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-amber-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === "en"
                      ? "Manage Taken Nicknames"
                      : "使用中ニックネームの管理"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "en"
                      ? "Release nicknames so students can claim them again."
                      : "ニックネームを解放して再利用可能にします。"}
                  </p>
                </div>
              </div>
              <button
                onClick={onCloseNicknameManager}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-end mb-2">
              <button
                onClick={fetchReservedNicknames}
                disabled={loadingNames}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <RefreshCw
                  size={12}
                  className={loadingNames ? "animate-spin" : ""}
                />
                {lang === "en" ? "Refresh" : "更新"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {reservedNames.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  {lang === "en"
                    ? "No claimed nicknames found."
                    : "登録されているニックネームはありません。"}
                </p>
              ) : (
                reservedNames.map((item) => (
                  <div
                    key={item.nickname}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {item.nickname}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Session: {item.session_id.slice(0, 10)}... |{" "}
                        {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleReleaseNickname(item.nickname)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      {lang === "en" ? "Release" : "解放"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
