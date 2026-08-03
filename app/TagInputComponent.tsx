"use client";

import { useState, useRef } from "react";
import { Tag, X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  allSuggestions: string[];
  lang: "en" | "jp";
  onTagsChange: (newTags: string[]) => void;
}

export function TagInputComponent({
  tags,
  allSuggestions,
  lang,
  onTagsChange,
}: TagInputProps) {
  const [inputVal, setInputVal] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanTag = (str: string) => str.trim().replace(/^#/, "").toLowerCase();

  const addTag = (rawTag: string) => {
    const formatted = cleanTag(rawTag);
    if (formatted && !tags.includes(formatted)) {
      onTagsChange([...tags, formatted]);
    }
    setInputVal("");
    setShowDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    // Delay blur to allow clicking dropdown items
    setTimeout(() => {
      if (inputVal.trim()) {
        addTag(inputVal);
      }
      setShowDropdown(false);
    }, 150);
  };

  const matchingSuggestions = allSuggestions
    .filter(
      (s) => s.includes(cleanTag(inputVal)) && !tags.includes(s.toLowerCase()),
    )
    .slice(0, 6);

  return (
    <div ref={containerRef} className="relative space-y-1.5 w-full">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
        <Tag size={13} />
        {lang === "en"
          ? "Tags (press Enter, comma, or click away to add)"
          : "タグ (Enter、カンマ、またはフォーカスを外して追加)"}
      </label>

      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl focus-within:border-[#1f497c] focus-within:ring-1 focus-within:ring-[#1f497c]/20 transition-all">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-200/80 transition-colors"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 cursor-pointer ml-0.5"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            tags.length === 0
              ? lang === "en"
                ? "Type a tag (e.g. question, homework)..."
                : "タグを入力 (例: 質問, 課題)..."
              : ""
          }
          className="flex-1 border-none focus:outline-none text-xs p-1 text-slate-800 min-w-[120px]"
        />
      </div>

      {/* Auto-suggest Dropdown */}
      {showDropdown && inputVal.trim() && matchingSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100">
          <div className="p-1.5 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {lang === "en" ? "Existing Tags" : "既存のタグ"}
          </div>
          {matchingSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(suggestion);
              }}
              className="w-full text-left px-3 py-2 text-xs font-mono text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Tag size={12} className="text-[#1f497c]" />#{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
