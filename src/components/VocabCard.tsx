import React, { useState } from "react";
import { Volume2, Edit2, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Vocabulary, Category } from "../types";

interface VocabCardProps {
  key?: string;
  vocab: Vocabulary;
  category?: Category;
  authToken: string;
  onEdit: (vocab: Vocabulary) => void;
  onDeleted: (vocabId: string) => void;
  onStatusChanged: (vocab: Vocabulary) => void;
}

export default function VocabCard({
  vocab,
  category,
  authToken,
  onEdit,
  onDeleted,
  onStatusChanged,
}: VocabCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const speakGerman = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        vocab.article !== "none" ? `${vocab.article} ${vocab.deutsch}` : vocab.deutsch
      );
      utterance.lang = "de-DE";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa từ vựng này không?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/vocab/${vocab.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể xóa từ vựng.");
      }

      onDeleted(vocab.id);
    } catch (error: any) {
      alert(error.message || "Lỗi xóa từ vựng.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = vocab.status === "mastered" ? "learning" : "mastered";

    try {
      const response = await fetch(`/api/vocab/${vocab.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Lỗi thay đổi trạng thái.");
      }

      onStatusChanged({ ...vocab, status: newStatus });
    } catch (error: any) {
      alert(error.message || "Lỗi cập nhật trạng thái.");
    }
  };

  // Determine left border color based on gender
  const getGenderBorder = () => {
    switch (vocab.article) {
      case "der":
        return "border-l-[6px] border-l-blue-600 hover:bg-[#FAF7F2]";
      case "die":
        return "border-l-[6px] border-l-rose-600 hover:bg-[#FAF7F2]";
      case "das":
        return "border-l-[6px] border-l-emerald-600 hover:bg-[#FAF7F2]";
      default:
        return "border-l-[6px] border-l-[#1A1A1A] hover:bg-[#FAF7F2]";
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`bg-white border-2 border-[#1A1A1A] rounded-none transition-all hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] cursor-pointer select-none overflow-hidden ${getGenderBorder()} ${
        deleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left column: Word detail */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {vocab.article !== "none" && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-none uppercase text-white tracking-widest font-sans ${
                  vocab.article === "der"
                    ? "bg-blue-600"
                    : vocab.article === "die"
                    ? "bg-rose-600"
                    : "bg-emerald-600"
                }`}
              >
                {vocab.article}
              </span>
            )}
            <h3 className="text-xl font-serif font-black italic tracking-tight text-[#1A1A1A] flex items-center gap-1">
              {vocab.deutsch}
            </h3>

            {/* Speaking voice */}
            <button
              onClick={speakGerman}
              className="p-1 rounded-none border border-[#1A1A1A] bg-[#FAF7F2] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition-colors cursor-pointer"
              title="Phát âm tiếng Đức"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-sm font-sans font-medium text-[#1A1A1A]/90 leading-snug">
            {vocab.vietnamesisch}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {vocab.plural && (
              <span className="text-[10px] font-bold font-mono text-[#1A1A1A] uppercase tracking-wider bg-[#FAF7F2] border border-[#1A1A1A] px-2 py-0.5 rounded-none">
                Plural: {vocab.plural}
              </span>
            )}

            {category && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border-2 border-[#1A1A1A] ${
                  category.color || "bg-white text-slate-800"
                }`}
              >
                {category.name}
              </span>
            )}
          </div>
        </div>

        {/* Right column: Actions & Status */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1A1A1A]/10 shrink-0">
          {/* Study Status trigger */}
          <button
            onClick={toggleStatus}
            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-none flex items-center gap-1.5 border-2 border-[#1A1A1A] transition-all cursor-pointer ${
              vocab.status === "mastered"
                ? "bg-emerald-100 text-emerald-950"
                : "bg-amber-100 text-amber-950"
            }`}
            title="Đánh dấu trạng thái ghi nhớ"
          >
            {vocab.status === "mastered" ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 fill-current text-emerald-700" /> Đã thuộc
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-700" /> Đang học
              </>
            )}
          </button>

          {/* Action edit/delete buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(vocab);
              }}
              className="p-1.5 rounded-none border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-slate-100 transition-colors cursor-pointer"
              title="Chỉnh sửa từ vựng"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-none border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-rose-100 transition-colors cursor-pointer"
              title="Xóa từ vựng"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-700" />
            </button>

            {/* Expand / Collapse trigger */}
            <div className="p-1.5 text-[#1A1A1A]">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded section: Example sentence */}
      {expanded && (vocab.exampleDe || vocab.exampleVi) && (
        <div className="px-5 pb-5 pt-3 border-t-2 border-[#1A1A1A] bg-[#FAF7F2] space-y-2 text-xs">
          <span className="font-sans font-bold text-[9px] text-[#1A1A1A] uppercase tracking-widest block">
            Ví dụ minh họa (Examples)
          </span>
          {vocab.exampleDe && (
            <p className="text-[#1A1A1A] font-serif font-medium italic flex items-center gap-1 text-sm">
              • {vocab.exampleDe}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakGerman(e);
                }}
                className="p-0.5 rounded-none border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </p>
          )}
          {vocab.exampleVi && <p className="text-[#1A1A1A]/80 font-serif pl-3">{vocab.exampleVi}</p>}
        </div>
      )}
    </div>
  );
}
