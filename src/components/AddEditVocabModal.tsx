import React, { useState, useEffect } from "react";
import { Sparkles, X, HelpCircle, AlertCircle, RefreshCw, BookOpen, ChevronRight, Check } from "lucide-react";
import { Category, Vocabulary, AIAnalysisResult } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AddEditVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  vocabToEdit?: Vocabulary | null;
  authToken: string;
  onVocabSaved: (vocab: Vocabulary) => void;
}

export default function AddEditVocabModal({
  isOpen,
  onClose,
  categories,
  vocabToEdit,
  authToken,
  onVocabSaved,
}: AddEditVocabModalProps) {
  const [deutsch, setDeutsch] = useState("");
  const [vietnamesisch, setVietnamesisch] = useState("");
  const [article, setArticle] = useState<"der" | "die" | "das" | "none">("none");
  const [plural, setPlural] = useState("");
  const [exampleDe, setExampleDe] = useState("");
  const [exampleVi, setExampleVi] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"learning" | "mastered">("learning");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vocabToEdit) {
      setDeutsch(vocabToEdit.deutsch);
      setVietnamesisch(vocabToEdit.vietnamesisch);
      setArticle(vocabToEdit.article);
      setPlural(vocabToEdit.plural || "");
      setExampleDe(vocabToEdit.exampleDe || "");
      setExampleVi(vocabToEdit.exampleVi || "");
      setCategoryId(vocabToEdit.categoryId);
      setStatus(vocabToEdit.status);
    } else {
      setDeutsch("");
      setVietnamesisch("");
      setArticle("none");
      setPlural("");
      setExampleDe("");
      setExampleVi("");
      setStatus("learning");
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      } else {
        setCategoryId("");
      }
    }
    setAiError(null);
    setAiSuccessMessage(null);
    setFormError(null);
  }, [vocabToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Tự động phân tích và điền từ vựng
  const handleAiAnalyze = async () => {
    if (!deutsch.trim()) {
      setAiError("Vui lòng nhập từ tiếng Đức trước khi phân tích.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ word: deutsch.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể kết nối với máy chủ phân tích dữ liệu.");
      }

      const result: AIAnalysisResult = data.result;

      if (result) {
        setDeutsch(result.deutsch || deutsch);
        setArticle(result.article || "none");
        setPlural(result.plural || "");
        setVietnamesisch(result.vietnamesisch || "");
        setExampleDe(result.exampleDe || "");
        setExampleVi(result.exampleVi || "");
        setAiSuccessMessage(
          `Đã phân tích và tự động điền thành công! ${
            result.article !== "none" ? `Giống từ: [${result.article.toUpperCase()}]` : ""
          } ${result.plural ? `, Số nhiều: [${result.plural}]` : ""}`
        );
      }
    } catch (err: any) {
      setAiError(err.message || "Đã xảy ra lỗi khi tự động phân tích từ vựng.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!deutsch.trim()) {
      setFormError("Vui lòng nhập từ tiếng Đức.");
      return;
    }
    if (!vietnamesisch.trim()) {
      setFormError("Vui lòng nhập nghĩa tiếng Việt.");
      return;
    }
    if (!categoryId) {
      setFormError("Vui lòng chọn hoặc tạo ít nhất một chủ đề học tập.");
      return;
    }

    setSaving(true);

    const payload = {
      deutsch: deutsch.trim(),
      vietnamesisch: vietnamesisch.trim(),
      article,
      plural: plural.trim(),
      exampleDe: exampleDe.trim(),
      exampleVi: exampleVi.trim(),
      categoryId,
      status,
    };

    try {
      const endpoint = vocabToEdit ? `/api/vocab/${vocabToEdit.id}` : "/api/vocab";
      const method = vocabToEdit ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể lưu từ vựng.");
      }

      onVocabSaved(vocabToEdit ? data.vocabulary : data.vocabulary);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Lỗi lưu từ vựng.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-[#FDFCFB] border-4 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-[#FAF7F2] border-b-4 border-[#1A1A1A] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-black tracking-tight uppercase text-[#1A1A1A]">
              {vocabToEdit ? "Chỉnh sửa từ vựng" : "Thêm Từ Vựng Mới"}
            </h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 mt-1">
              Nhập từ vựng tiếng Đức để lưu trữ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#1A1A1A] hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-[#1A1A1A]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 border-2 border-[#1A1A1A] bg-rose-50 text-rose-700 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Word & AI Suggestion */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-7 space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 flex items-center gap-1">
                Tiếng Đức (Deutsch) <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ví dụ: Hund, Katze, gehen..."
                value={deutsch}
                onChange={(e) => setDeutsch(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A]"
              />
            </div>
            <div className="md:col-span-5">
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={aiLoading || !deutsch.trim()}
                className="w-full py-2.5 px-3 bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] disabled:opacity-40 disabled:hover:bg-[#1A1A1A] disabled:hover:text-white border-2 border-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-current" /> Phân tích từ
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Banner Feedback */}
          <AnimatePresence mode="wait">
            {aiError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2.5 border-2 border-[#1A1A1A] bg-amber-50 text-[#1A1A1A] text-xs font-mono flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </motion.div>
            )}

            {aiSuccessMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2.5 border-2 border-[#1A1A1A] bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2"
              >
                <Check className="w-4 h-4 shrink-0 bg-[#1A1A1A] text-white rounded-none p-0.5 border border-[#1A1A1A]" />
                <span>{aiSuccessMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section 2: Gender & Plural */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 block">Giống ngữ pháp (Noun Gender)</label>
              <div className="grid grid-cols-4 gap-2">
                {(["der", "die", "das", "none"] as const).map((g) => {
                  const label = g === "none" ? "Khác" : g;
                  const activeClasses =
                    g === "der"
                      ? "bg-blue-600 text-white border-blue-600 font-bold"
                      : g === "die"
                      ? "bg-rose-600 text-white border-rose-600 font-bold"
                      : g === "das"
                      ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                      : "bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold";
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setArticle(g)}
                      className={`py-2 text-xs border-2 rounded-none transition-all cursor-pointer ${
                        article === g ? activeClasses : "bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Dạng số nhiều (Plural form)</label>
              <input
                type="text"
                placeholder="ví dụ: die Hunde, die Katzen"
                value={plural}
                onChange={(e) => setPlural(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Section 3: Vietnamesisch */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 flex items-center gap-1">
              Nghĩa Tiếng Việt (Vietnamesisch) <span className="text-rose-600 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ví dụ: con chó, đi học, đẹp đẽ..."
              value={vietnamesisch}
              onChange={(e) => setVietnamesisch(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A]"
            />
          </div>

          {/* Section 4: Topic & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Thuộc chủ đề <span className="text-rose-600 font-bold">*</span></label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A] bg-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {categories.length === 0 && <option value="">(Hãy tạo chủ đề ở bảng điều khiển trước)</option>}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Trạng thái ghi nhớ</label>
              <div className="flex border-2 border-[#1A1A1A] p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setStatus("learning")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    status === "learning" ? "bg-amber-500 text-[#1A1A1A] font-black" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                  }`}
                >
                  Đang học
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("mastered")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    status === "mastered" ? "bg-emerald-600 text-white font-black" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                  }`}
                >
                  Đã thuộc
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Example German - Vietnamese */}
          <div className="bg-[#FAF7F2] p-4 border-2 border-[#1A1A1A] space-y-4">
            <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-[#1A1A1A] block">
              Ví dụ mẫu tự học (Examples)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Ví dụ bằng tiếng Đức</label>
                <textarea
                  placeholder="Der Hund bellt laut."
                  value={exampleDe}
                  onChange={(e) => setExampleDe(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60">Bản dịch nghĩa tiếng Việt</label>
                <textarea
                  placeholder="Con chó đang sủa lớn."
                  value={exampleVi}
                  onChange={(e) => setExampleVi(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-[#1A1A1A] border-dashed flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#1A1A1A] hover:bg-slate-100 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving || categories.length === 0}
              className="px-6 py-2 bg-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] text-xs font-extrabold uppercase tracking-widest transition-all shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] cursor-pointer disabled:opacity-40"
            >
              {saving ? "Đang lưu..." : vocabToEdit ? "Cập Nhật" : "Lưu Từ Vựng"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
