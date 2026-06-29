import React, { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LoginRegisterProps {
  onAuthSuccess: (token: string, user: { uid: string; email: string; name: string }) => void;
}

export default function LoginRegister({ onAuthSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { email, password, name, secretCode };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }

      // Lưu token vào localStorage
      localStorage.setItem("vocab_tracker_token", data.token);
      localStorage.setItem("vocab_tracker_user", JSON.stringify(data.user));

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4 font-sans selection:bg-[#1A1A1A] selection:text-white">
      <div className="absolute inset-0 border-[12px] border-[#1A1A1A] pointer-events-none z-50" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-[#FDFCFB] border-4 border-[#1A1A1A] p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-none bg-[#1A1A1A] text-white mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-display font-black tracking-tighter uppercase text-[#1A1A1A] flex items-center justify-center gap-1.5">
              WortSchatz
            </h1>
            <p className="text-[#1A1A1A] opacity-60 mt-2 text-xs uppercase tracking-widest font-bold font-sans">
              Vokabeltrainer v.1.0
            </p>
          </div>

          {/* Form switch tab */}
          <div className="flex border-2 border-[#1A1A1A] mb-6 p-0.5 bg-white">
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isLogin
                  ? "bg-[#1A1A1A] text-white font-black"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                !isLogin
                  ? "bg-[#1A1A1A] text-white font-black"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 border-2 border-[#1A1A1A] bg-rose-50 text-[#1A1A1A] text-xs font-mono flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 font-sans">Tên của bạn</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-[#1A1A1A]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-[#1A1A1A] focus:bg-white text-sm outline-none transition-all placeholder:text-slate-400 font-serif italic"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 font-sans">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[#1A1A1A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nhap@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-[#1A1A1A] focus:bg-white text-sm outline-none transition-all placeholder:text-slate-400 font-serif italic"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 font-sans">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#1A1A1A]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-[#1A1A1A] focus:bg-white text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] opacity-60 font-sans">Mã đăng ký bí mật (Secret Code)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-[#1A1A1A]" />
                  <input
                    type="text"
                    required
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    placeholder="Nhập mã bí mật để kích hoạt"
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-2 border-[#1A1A1A] focus:bg-white text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-[#1A1A1A] hover:bg-[#FDFCFB] text-white hover:text-[#1A1A1A] border-2 border-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-3.5 h-3.5" /> Đăng Nhập
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> Đăng Ký Tài Khoản
                </>
              )}
            </button>
          </form>

          {/* Note / Guide for demo */}
          <div className="mt-8 pt-6 border-t border-[#1A1A1A] border-dashed text-center">
            <p className="text-xs italic font-serif text-[#1A1A1A]/60">
              {isLogin ? "Chưa có tài khoản? Đăng ký tại đây." : "Đã có tài khoản? Quay về đăng nhập."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
