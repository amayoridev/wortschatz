import React, { useState } from "react";
import { FolderPlus, Trash2, Tag, BookOpen, Circle, AlertCircle } from "lucide-react";
import { Category, Vocabulary } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface CategoryManagerProps {
  categories: Category[];
  vocabularies: Vocabulary[];
  authToken: string;
  onCategoryCreated: (category: Category) => void;
  onCategoryDeleted: (categoryId: string) => void;
}

const PALETTES = [
  { name: "Beige", color: "bg-[#FAF7F2] border-2 border-[#1A1A1A] text-[#1A1A1A] ring-[#1A1A1A]" },
  { name: "Sage", color: "bg-[#F1F5F0] border-2 border-[#1A1A1A] text-[#2C4A3E] ring-[#2C4A3E]" },
  { name: "Slate", color: "bg-[#F0F4F8] border-2 border-[#1A1A1A] text-[#2A4365] ring-[#2A4365]" },
  { name: "Ochre", color: "bg-[#FCF7ED] border-2 border-[#1A1A1A] text-[#744210] ring-[#744210]" },
  { name: "Terracotta", color: "bg-[#FDF3F3] border-2 border-[#1A1A1A] text-[#7B341E] ring-[#7B341E]" },
  { name: "Mauve", color: "bg-[#F6F0F8] border-2 border-[#1A1A1A] text-[#553C9A] ring-[#553C9A]" },
];

export default function CategoryManager({
  categories,
  vocabularies,
  authToken,
  onCategoryCreated,
  onCategoryDeleted,
}: CategoryManagerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(PALETTES[0].color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          color: selectedColor,
          description: description.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo chủ đề.");
      }

      onCategoryCreated(data.category);
      setName("");
      setDescription("");
      setSelectedColor(PALETTES[0].color);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa chủ đề này? Tất cả các từ vựng thuộc về chủ đề này cũng sẽ bị xóa vĩnh viễn.")) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể xóa chủ đề.");
      }

      onCategoryDeleted(categoryId);
    } catch (err: any) {
      alert(err.message || "Lỗi xóa chủ đề.");
    }
  };

  const getVocabCount = (catId: string) => {
    return vocabularies.filter((v) => v.categoryId === catId).length;
  };

  return (
    <div className="space-y-6">
      {/* Create New Category Card */}
      <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 mb-4">
          <FolderPlus className="w-4 h-4 text-[#1A1A1A]" />
          Tạo Chủ Đề Mới
        </h3>

        {error && (
          <div className="mb-4 p-3 border-2 border-[#1A1A1A] bg-rose-50 text-rose-700 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Tên chủ đề</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Động vật, Mua sắm..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#1A1A1A] bg-white outline-none text-sm font-serif italic"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Mô tả chủ đề (Không bắt buộc)</label>
            <textarea
              placeholder="Từ vựng về..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border-2 border-[#1A1A1A] bg-white outline-none text-sm font-serif italic resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 block">Chọn màu nhận diện</label>
            <div className="flex flex-wrap gap-2">
              {PALETTES.map((p) => {
                const borderClass = p.color.split(" ")[1];
                const bgClass = p.color.split(" ")[0];
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedColor(p.color)}
                    className={`w-7 h-7 rounded-none border-2 border-[#1A1A1A] ${bgClass} transition-all flex items-center justify-center cursor-pointer ${
                      selectedColor === p.color ? "ring-2 ring-offset-2 ring-[#1A1A1A] scale-110" : "hover:scale-105"
                    }`}
                    title={p.name}
                  >
                    <Circle className="w-2 h-2 fill-[#1A1A1A] opacity-80" />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-2.5 bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
          >
            {loading ? "Đang lưu..." : "Lưu Chủ Đề"}
          </button>
        </form>
      </div>

      {/* List Categories Card */}
      <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-[#1A1A1A]" />
          Danh Sách Chủ Đề ({categories.length})
        </h3>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 border-2 border-[#1A1A1A] rounded-none flex items-start justify-between gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] ${cat.color || "bg-white text-slate-800"}`}
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-sans font-bold leading-none flex items-center flex-wrap gap-1.5 text-[#1A1A1A]">
                    {cat.name}
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white border-2 border-[#1A1A1A] font-sans">
                      <BookOpen className="w-2.5 h-2.5 text-[#1A1A1A]" />
                      {getVocabCount(cat.id)} từ
                    </span>
                  </h4>
                  {cat.description && (
                    <p className="text-xs font-serif italic text-[#1A1A1A] opacity-80 leading-relaxed pt-1 border-t border-[#1A1A1A]/10 mt-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1 rounded-none border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-rose-100 transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Xóa chủ đề này"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                </button>
              </motion.div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-6 text-slate-500 font-serif italic text-xs">
                Chưa có chủ đề nào được tạo.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
