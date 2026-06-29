import React, { useState, useEffect } from "react";
import {
  BookOpen,
  LogOut,
  Plus,
  Search,
  Filter,
  Sparkles,
  Award,
  BookMarked,
  CheckCircle,
  HelpCircle,
  User as UserIcon,
  Tag,
  Volume2
} from "lucide-react";
import LoginRegister from "./components/LoginRegister";
import AddEditVocabModal from "./components/AddEditVocabModal";
import VocabCard from "./components/VocabCard";
import CategoryManager from "./components/CategoryManager";
import StudyMode from "./components/StudyMode";
import { Category, Vocabulary } from "./types";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("vocab_tracker_token"));
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; name: string } | null>(null);

  // Core vocabulary data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);

  // Navigation / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState<Vocabulary | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedGenderFilter, setSelectedGenderFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load user data on startup if token is valid
  useEffect(() => {
    if (authToken) {
      try {
        const userStr = localStorage.getItem("vocab_tracker_user");
        if (userStr) {
          setCurrentUser(JSON.parse(userStr));
        }
        fetchDashboardData(authToken);
      } catch (err) {
        console.error("Failed to parse stored user", err);
        handleLogout();
      }
    }
  }, [authToken]);

  const fetchDashboardData = async (token: string) => {
    setLoading(true);
    setDataError(null);
    try {
      // Fetch categories & vocabularies in parallel
      const [catsRes, vocabsRes] = await Promise.all([
        fetch("/api/categories", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/vocab", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (catsRes.status === 401 || vocabsRes.status === 401) {
        handleLogout();
        return;
      }

      const catsData = await catsRes.json();
      const vocabsData = await vocabsRes.json();

      if (catsRes.ok) setCategories(catsData.categories || []);
      if (vocabsRes.ok) setVocabularies(vocabsData.vocabularies || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setDataError("Không thể kết nối với máy chủ. Vui lòng tải lại trang.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, user: { uid: string; email: string; name: string }) => {
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("vocab_tracker_token");
    localStorage.removeItem("vocab_tracker_user");
    setAuthToken(null);
    setCurrentUser(null);
    setCategories([]);
    setVocabularies([]);
    setIsStudyMode(false);
  };

  // State handlers for components
  const handleCategoryCreated = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleCategoryDeleted = (deletedId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== deletedId));
    // Also update vocabularies that were removed with this category in backend
    setVocabularies((prev) => prev.filter((v) => v.categoryId !== deletedId));
    if (selectedCategoryFilter === deletedId) {
      setSelectedCategoryFilter("all");
    }
  };

  const handleVocabSaved = (savedVocab: Vocabulary) => {
    setVocabularies((prev) => {
      const exists = prev.some((v) => v.id === savedVocab.id);
      if (exists) {
        return prev.map((v) => (v.id === savedVocab.id ? savedVocab : v));
      } else {
        return [savedVocab, ...prev];
      }
    });
    setVocabToEdit(null);
  };

  const handleVocabDeleted = (vocabId: string) => {
    setVocabularies((prev) => prev.filter((v) => v.id !== vocabId));
  };

  const handleVocabStatusChanged = (updatedVocab: Vocabulary) => {
    setVocabularies((prev) => prev.map((v) => (v.id === updatedVocab.id ? updatedVocab : v)));
  };

  // Filter computation logic
  const filteredVocabularies = vocabularies.filter((v) => {
    const matchesSearch =
      v.deutsch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vietnamesisch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === "all" || v.categoryId === selectedCategoryFilter;
    const matchesStatus = selectedStatusFilter === "all" || v.status === selectedStatusFilter;
    const matchesGender = selectedGenderFilter === "all" || v.article === selectedGenderFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesGender;
  });

  // Mastered percentage calculation
  const totalCount = vocabularies.length;
  const masteredCount = vocabularies.filter((v) => v.status === "mastered").length;
  const learningCount = totalCount - masteredCount;
  const masteredPercentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  if (!authToken || !currentUser) {
    return <LoginRegister onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-white">
      {/* Upper Decoration Header */}
      <div className="bg-[#1A1A1A] text-white border-b-4 border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#1A1A1A] p-1.5 rounded-none border-2 border-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight uppercase">WortSchatz</h1>
              <p className="text-[9px] text-[#FAF7F2] opacity-70 uppercase tracking-widest font-mono">Vokabeltrainer & Smart Dictionary</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#2A2A2A] px-3 py-1.5 border border-white/10 text-xs font-mono">
              <UserIcon className="w-3.5 h-3.5 text-slate-300" />
              <span>Hallo, {currentUser.name}!</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border-2 border-white bg-transparent hover:bg-white hover:text-[#1A1A1A] transition-all cursor-pointer text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              title="Đăng xuất khỏi tài khoản"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dataError && (
          <div className="mb-6 p-4 border-2 border-[#1A1A1A] bg-rose-50 text-rose-800 text-xs font-mono flex items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <span>{dataError}</span>
            <button
              onClick={() => fetchDashboardData(authToken)}
              className="px-3 py-1 bg-white border-2 border-[#1A1A1A] hover:bg-rose-100 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Tải Lại
            </button>
          </div>
        )}

        {/* Dashboard Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] text-[#1A1A1A]/60 font-extrabold block uppercase tracking-wider">Tổng từ vựng</span>
              <span className="text-2xl font-serif font-black text-[#1A1A1A]">{totalCount} từ</span>
            </div>
          </div>

          <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-600 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] text-[#1A1A1A]/60 font-extrabold block uppercase tracking-wider">Đã thuộc lòng</span>
              <span className="text-2xl font-serif font-black text-emerald-800">{masteredCount} từ</span>
            </div>
          </div>

          <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 border-2 border-amber-600 text-amber-800 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 rotate-45" />
            </div>
            <div>
              <span className="text-[9px] text-[#1A1A1A]/60 font-extrabold block uppercase tracking-wider">Đang học tập</span>
              <span className="text-2xl font-serif font-black text-amber-800">{learningCount} từ</span>
            </div>
          </div>

          <div className="bg-[#FAF7F2] border-4 border-[#1A1A1A] p-5 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-[#1A1A1A]/60 font-extrabold uppercase tracking-wider">Tỷ lệ thuộc bài</span>
              <span className="text-xs font-bold font-mono text-[#1A1A1A]">{masteredPercentage}%</span>
            </div>
            <div className="w-full bg-white border-2 border-[#1A1A1A] h-3 overflow-hidden">
              <div
                className="bg-[#1A1A1A] h-full transition-all duration-500"
                style={{ width: `${masteredPercentage}%` }}
              />
            </div>
            <span className="text-[9px] font-serif italic text-[#1A1A1A]/70 mt-2 block">
              Đặt mục tiêu thuộc 100% để nói tự tin hơn!
            </span>
          </div>
        </div>

        {/* Study Mode Toggle or Main Dashboard Layout */}
        <AnimatePresence mode="wait">
          {isStudyMode ? (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
            >
              <StudyMode
                vocabularies={vocabularies}
                categories={categories}
                authToken={authToken}
                onVocabUpdated={handleVocabStatusChanged}
                onClose={() => setIsStudyMode(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Main Section: Vocabularies & Search Filter */}
              <div className="lg:col-span-8 space-y-6">
                {/* Search, Action bar */}
                <div className="bg-[#FAF7F2] border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-[#1A1A1A]" />
                      <input
                        type="text"
                        placeholder="Tìm từ vựng (Tiếng Đức hoặc tiếng Việt)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-[#1A1A1A] outline-none text-sm font-serif italic text-[#1A1A1A]"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => {
                          setVocabToEdit(null);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none py-3 px-4 bg-[#1A1A1A] hover:bg-[#FAF7F2] text-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:scale-[0.98]"
                      >
                        <Plus className="w-4.5 h-4.5" />
                        Ghi Từ Mới
                      </button>

                      <button
                        onClick={() => setIsStudyMode(true)}
                        disabled={vocabularies.length === 0}
                        className="flex-1 sm:flex-none py-3 px-4 bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white border-2 border-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] disabled:opacity-40"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        Học Flashcard
                      </button>
                    </div>
                  </div>

                  {/* Multi Filters Row */}
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t-2 border-[#1A1A1A]/10 text-xs">
                    <span className="text-[#1A1A1A]/70 font-extrabold uppercase tracking-widest flex items-center gap-1 shrink-0">
                      <Filter className="w-3.5 h-3.5" /> Lọc danh sách:
                    </span>

                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5 bg-white border-2 border-[#1A1A1A] px-2.5 py-1">
                      <span className="text-[#1A1A1A]/60 font-bold uppercase tracking-wider text-[10px]">Chủ đề:</span>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-transparent focus:outline-none font-bold text-[#1A1A1A] cursor-pointer"
                      >
                        <option value="all">Tất cả</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 bg-white border-2 border-[#1A1A1A] px-2.5 py-1">
                      <span className="text-[#1A1A1A]/60 font-bold uppercase tracking-wider text-[10px]">Ghi nhớ:</span>
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        className="bg-transparent focus:outline-none font-bold text-[#1A1A1A] cursor-pointer"
                      >
                        <option value="all">Tất cả</option>
                        <option value="learning">Đang học</option>
                        <option value="mastered">Đã thuộc</option>
                      </select>
                    </div>

                    {/* Gender Filter */}
                    <div className="flex items-center gap-1.5 bg-white border-2 border-[#1A1A1A] px-2.5 py-1">
                      <span className="text-[#1A1A1A]/60 font-bold uppercase tracking-wider text-[10px]">Giống:</span>
                      <select
                        value={selectedGenderFilter}
                        onChange={(e) => setSelectedGenderFilter(e.target.value)}
                        className="bg-transparent focus:outline-none font-bold text-[#1A1A1A] cursor-pointer"
                      >
                        <option value="all">Tất cả</option>
                        <option value="der">Der (Đực)</option>
                        <option value="die">Die (Cái)</option>
                        <option value="das">Das (Trung)</option>
                        <option value="none">Khác (None)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Vocabulary Card List */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-12 bg-white border-4 border-[#1A1A1A] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
                      <div className="w-8 h-8 border-3 border-[#1A1A1A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">Đang đồng bộ hóa từ đám mây...</p>
                    </div>
                  ) : filteredVocabularies.length === 0 ? (
                    <div className="text-center py-12 bg-white border-4 border-[#1A1A1A] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
                      <p className="text-sm font-sans font-extrabold uppercase tracking-widest text-[#1A1A1A]">Không tìm thấy từ vựng nào</p>
                      <p className="text-xs text-[#1A1A1A]/60 font-serif italic mt-1.5 max-w-xs mx-auto">
                        {vocabularies.length === 0
                          ? "Hãy nhập từ vựng đầu tiên của bạn để lưu vào cơ sở dữ liệu."
                          : "Không tìm thấy kết quả nào phù hợp với điều kiện lọc."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredVocabularies.map((vocab) => (
                        <VocabCard
                          key={vocab.id}
                          vocab={vocab}
                          category={categories.find((c) => c.id === vocab.categoryId)}
                          authToken={authToken}
                          onEdit={(v) => {
                            setVocabToEdit(v);
                            setIsModalOpen(true);
                          }}
                          onDeleted={handleVocabDeleted}
                          onStatusChanged={handleVocabStatusChanged}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side Section: Category Panel / Quick Add Guide */}
              <div className="lg:col-span-4 space-y-6">
                {/* Category Selector Dashboard */}
                <CategoryManager
                  categories={categories}
                  vocabularies={vocabularies}
                  authToken={authToken}
                  onCategoryCreated={handleCategoryCreated}
                  onCategoryDeleted={handleCategoryDeleted}
                />

                {/* Quick study instructions card */}
                <div className="bg-[#FAF7F2] border-4 border-[#1A1A1A] p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A] space-y-4 relative overflow-hidden">
                  <h3 className="text-sm font-sans font-extrabold uppercase tracking-wider flex items-center gap-1.5 relative border-b-2 border-[#1A1A1A] pb-2">
                    <BookOpen className="w-4.5 h-4.5" />
                    Mẹo Học Tiếng Đức Hiệu Quả
                  </h3>
                  <ul className="space-y-3.5 text-xs text-[#1A1A1A] relative font-serif">
                    <li className="flex gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span><b>Quán từ danh từ:</b> Luôn học danh từ kèm theo quán từ <b>der / die / das</b> và màu sắc nhận diện.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span><b>Dạng số nhiều:</b> Ghi nhớ dạng số nhiều (Plural) giúp bạn chia động từ và sử dụng ngữ pháp chính xác hơn.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">✓</span>
                      <span><b>Đặt câu ví dụ:</b> Đọc và viết các câu ví dụ thực tế song ngữ Đức - Việt để nhớ từ vựng lâu hơn theo ngữ cảnh.</span>
                    </li>
                  </ul>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 border-t border-[#1A1A1A] border-dashed pt-3.5">
                    Hệ thống lưu trữ cơ sở dữ liệu thông minh và bảo mật.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Vocabulary Modal Manager */}
      <AnimatePresence>
        {isModalOpen && (
          <AddEditVocabModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setVocabToEdit(null);
            }}
            categories={categories}
            vocabToEdit={vocabToEdit}
            authToken={authToken}
            onVocabSaved={handleVocabSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
