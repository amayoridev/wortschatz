import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, CheckCircle, HelpCircle, BookOpen, Volume2, Sparkles } from "lucide-react";
import { Category, Vocabulary } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface StudyModeProps {
  vocabularies: Vocabulary[];
  categories: Category[];
  authToken: string;
  onVocabUpdated: (vocab: Vocabulary) => void;
  onClose: () => void;
}

export default function StudyMode({
  vocabularies,
  categories,
  authToken,
  onVocabUpdated,
  onClose,
}: StudyModeProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [filteredVocabs, setFilteredVocabs] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter vocabs based on selected category
  useEffect(() => {
    let items = vocabularies;
    if (selectedCategoryId !== "all") {
      items = vocabularies.filter((v) => v.categoryId === selectedCategoryId);
    }
    // Sắp xếp ngẫu nhiên để việc học được khách quan hơn
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    setFilteredVocabs(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategoryId, vocabularies]);

  const activeVocab = filteredVocabs[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredVocabs.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredVocabs.length) % filteredVocabs.length);
    }, 150);
  };

  const handleMarkAsMastered = async () => {
    if (!activeVocab) return;

    const newStatus = activeVocab.status === "mastered" ? "learning" : "mastered";
    try {
      const response = await fetch(`/api/vocab/${activeVocab.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedVocab = { ...activeVocab, status: newStatus };
        onVocabUpdated(updatedVocab);
        
        // Cập nhật trạng thái trong list đang học
        const updatedFiltered = [...filteredVocabs];
        updatedFiltered[currentIndex] = updatedVocab;
        setFilteredVocabs(updatedFiltered);
      }
    } catch (error) {
      console.error("Error updating status in study mode:", error);
    }
  };

  // Text-to-speech cho tiếng Đức
  const speakGerman = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Lấy chi tiết chủ đề đang học
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FDFCFB] border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
        <div>
          <h2 className="text-xl font-display font-black tracking-tight uppercase text-[#1A1A1A] flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-[#1A1A1A]" />
            Thẻ Flashcard Ôn Tập
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 mt-1">
            Học tập chủ động qua thẻ ghi nhớ thông minh
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#1A1A1A]">Chủ đề:</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="px-3 py-1.5 border-2 border-[#1A1A1A] rounded-none text-xs font-sans font-bold uppercase tracking-wider focus:outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả ({vocabularies.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({vocabularies.filter((v) => v.categoryId === cat.id).length})
              </option>
            ))}
          </select>

          <button
            onClick={onClose}
            className="px-4 py-1.5 border-2 border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer"
          >
            Quay Lại
          </button>
        </div>
      </div>

      {filteredVocabs.length === 0 ? (
        <div className="bg-white border-4 border-[#1A1A1A] p-12 text-center shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] max-w-xl mx-auto">
          <div className="w-16 h-16 border-2 border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center mx-auto mb-4 bg-[#FAF7F2]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-sans font-extrabold uppercase tracking-widest text-[#1A1A1A]">Không có từ vựng nào</h3>
          <p className="text-xs text-[#1A1A1A]/60 font-serif italic mt-2 max-w-xs mx-auto leading-relaxed">
            Chủ đề này chưa có từ vựng nào được thêm vào.
          </p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] px-1">
            <span>
              Thẻ: <b>{currentIndex + 1}</b> / {filteredVocabs.length}
            </span>
            <span className="flex items-center gap-1">
              Độ thuộc:{" "}
              <b>
                {Math.round(
                  (filteredVocabs.filter((v) => v.status === "mastered").length / filteredVocabs.length) * 100
                )}
                %
              </b>
            </span>
          </div>

          <div className="w-full bg-white border-2 border-[#1A1A1A] rounded-none h-3 overflow-hidden">
            <div
              className="bg-[#1A1A1A] h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / filteredVocabs.length) * 100}%` }}
            />
          </div>

          {/* Flashcard Area */}
          <div
            className="relative h-80 w-full cursor-pointer group perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front of Card (Deutsch) */}
              <div className="absolute inset-0 backface-hidden bg-white border-4 border-[#1A1A1A] rounded-none p-8 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#FAF7F2] border border-[#1A1A1A] text-[#1A1A1A] rounded-none">
                    Mặt Trước (Tiếng Đức)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {activeVocab.article !== "none" && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-none uppercase text-white tracking-wider font-sans ${
                          activeVocab.article === "der"
                            ? "bg-blue-600"
                            : activeVocab.article === "die"
                            ? "bg-rose-600"
                            : "bg-emerald-600"
                        }`}
                      >
                        {activeVocab.article}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakGerman(
                          activeVocab.article !== "none"
                            ? `${activeVocab.article} ${activeVocab.deutsch}`
                            : activeVocab.deutsch
                        );
                      }}
                      className="p-1.5 border border-[#1A1A1A] bg-[#FAF7F2] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition-colors cursor-pointer"
                      title="Phát âm tiếng Đức"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4">
                  <h3 className="text-4xl font-serif font-black italic tracking-tight text-[#1A1A1A]">
                    {activeVocab.article !== "none" && (
                      <span className="text-[#1A1A1A]/40 font-normal mr-2 text-2xl font-serif not-italic">
                        {activeVocab.article}
                      </span>
                    )}
                    {activeVocab.deutsch}
                  </h3>
                  {activeVocab.plural && (
                    <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/70 mt-3 font-mono">
                      Plural: {activeVocab.plural}
                    </p>
                  )}
                </div>

                <div className="text-center text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]/70 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-[#1A1A1A]" /> Nhấn để xem nghĩa tiếng Việt
                </div>
              </div>

              {/* Back of Card (Vietnamesisch) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1A1A1A] border-4 border-[#1A1A1A] rounded-none p-8 flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-black border border-white/20 text-white rounded-none">
                    Mặt Sau (Tiếng Việt)
                  </span>
                  {activeVocab.status === "mastered" && (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-400 rounded-none">
                      <CheckCircle className="w-3 h-3 fill-emerald-400 text-emerald-950" /> Đã thuộc lòng
                    </span>
                  )}
                </div>

                <div className="text-center py-4 space-y-3">
                  <h4 className="text-2xl font-serif font-bold tracking-tight text-white italic">
                    {activeVocab.vietnamesisch}
                  </h4>
                  {activeVocab.exampleDe && (
                    <div className="max-w-xs mx-auto border-t border-white/20 pt-3 text-left space-y-1.5">
                      <p className="text-xs text-amber-200 italic font-serif leading-relaxed">
                        Ex: {activeVocab.exampleDe}
                      </p>
                      {activeVocab.exampleVi && (
                        <p className="text-[11px] text-white/70 leading-relaxed font-serif">
                          Nghĩa: {activeVocab.exampleVi}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] uppercase font-bold tracking-widest text-white/50">
                  Nhấn để lật lại tiếng Đức
                </div>
              </div>
            </div>
          </div>

          {/* Review Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              className="p-3 bg-white border-2 border-[#1A1A1A] rounded-none hover:bg-slate-50 text-[#1A1A1A] transition-colors shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] cursor-pointer"
              title="Thẻ trước"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleMarkAsMastered}
              className={`flex-1 py-3 px-4 rounded-none text-xs font-bold uppercase tracking-widest border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeVocab.status === "mastered"
                  ? "bg-slate-100 border-[#1A1A1A] text-slate-800"
                  : "bg-[#1A1A1A] border-[#1A1A1A] hover:bg-white text-white hover:text-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {activeVocab.status === "mastered" ? "Học lại từ này" : "Đã thuộc từ này!"}
            </button>

            <button
              onClick={handleNext}
              className="p-3 bg-white border-2 border-[#1A1A1A] rounded-none hover:bg-slate-50 text-[#1A1A1A] transition-colors shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] cursor-pointer"
              title="Thẻ tiếp theo"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
