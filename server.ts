import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findOne,
  findMany,
  insertOne,
  updateOne,
  deleteOne,
  deleteMany
} from "./db";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "german-vocab-secret-key-2026";

app.use(express.json());

// Helper middleware for Auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập để tiếp tục." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ." });
    }
    req.user = user;
    next();
  });
};

// --- AUTH API ROUTES ---

// Đăng ký thành viên
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, secretCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ Email và Mật khẩu." });
  }

  if (!secretCode || secretCode !== "moimoimoi") {
    return res.status(403).json({ error: "Mã đăng ký bí mật không chính xác hoặc đã hết hạn. Đăng ký mới bị khóa." });
  }

  try {
    const lowercaseEmail = email.toLowerCase().trim();
    const existingUser = await findOne("users", { email: lowercaseEmail });

    if (existingUser) {
      return res.status(400).json({ error: "Email này đã được đăng ký sử dụng." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const uid = "user_" + Math.random().toString(36).substring(2, 15);

    // Lưu vào DB
    await insertOne("users", {
      uid,
      email: lowercaseEmail,
      passwordHash,
      name: name || lowercaseEmail.split("@")[0],
      createdAt: new Date().toISOString(),
    });

    // Tạo các chủ đề mặc định cho người dùng mới
    const defaultCategories = [
      { name: "Giao tiếp hàng ngày", color: "bg-emerald-50 border-emerald-200 text-emerald-800", description: "Từ vựng chào hỏi, giới thiệu bản thân và trò chuyện cơ bản" },
      { name: "Thời tiết & Môi trường", color: "bg-blue-50 border-blue-200 text-blue-800", description: "Mô tả thời tiết, mùa và tự nhiên" },
      { name: "Ẩm thực & Nhà hàng", color: "bg-amber-50 border-amber-200 text-amber-800", description: "Món ăn, đồ uống, đặt món và nấu nướng" },
      { name: "Công việc & Trường học", color: "bg-purple-50 border-purple-200 text-purple-800", description: "Các ngành nghề, dụng cụ học tập và công sở" }
    ];

    for (const cat of defaultCategories) {
      const catId = "cat_" + Math.random().toString(36).substring(2, 15);
      await insertOne("categories", {
        id: catId,
        userId: uid,
        name: cat.name,
        color: cat.color,
        description: cat.description,
        createdAt: new Date().toISOString()
      });
    }

    // Tạo token
    const token = jwt.sign({ uid, email: lowercaseEmail, name: name || lowercaseEmail.split("@")[0] }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { uid, email: lowercaseEmail, name: name || lowercaseEmail.split("@")[0] },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi hệ thống trong quá trình đăng ký." });
  }
});

// Đăng nhập
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu." });
  }

  try {
    const lowercaseEmail = email.toLowerCase().trim();
    const userData = await findOne("users", { email: lowercaseEmail });

    if (!userData) {
      return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    const token = jwt.sign(
      { uid: userData.uid, email: userData.email, name: userData.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { uid: userData.uid, email: userData.email, name: userData.name },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi hệ thống khi đăng nhập." });
  }
});

// Lấy thông tin cá nhân hiện tại
app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const userData = await findOne("users", { uid: req.user.uid });
    if (!userData) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }
    res.json({
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Lỗi tải thông tin tài khoản." });
  }
});

// --- CATEGORIES API ROUTES ---

// Lấy danh sách chủ đề của người dùng
app.get("/api/categories", authenticateToken, async (req: any, res) => {
  try {
    const categories = await findMany("categories", { userId: req.user.uid });
    res.json({ categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    res.status(500).json({ error: "Không thể lấy danh sách chủ đề." });
  }
});

// Thêm chủ đề mới
app.post("/api/categories", authenticateToken, async (req: any, res) => {
  const { name, color, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Tên chủ đề không được bỏ trống." });
  }

  try {
    const id = "cat_" + Math.random().toString(36).substring(2, 15);
    const newCategory = {
      id,
      userId: req.user.uid,
      name: name.trim(),
      color: color || "bg-slate-50 border-slate-200 text-slate-800",
      description: description ? description.trim() : "",
      createdAt: new Date().toISOString()
    };

    await insertOne("categories", newCategory);
    res.status(201).json({ category: newCategory });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Không thể tạo chủ đề mới." });
  }
});

// Xóa chủ đề (và tùy chọn là xóa hoặc chuyển từ vựng trong đó)
app.delete("/api/categories/:id", authenticateToken, async (req: any, res) => {
  const { id } = req.params;

  try {
    const catSnap = await findOne("categories", { id });

    if (!catSnap || catSnap.userId !== req.user.uid) {
      return res.status(403).json({ error: "Không có quyền xóa chủ đề này." });
    }

    await deleteOne("categories", { id });

    // Cũng có thể xóa tất cả từ vựng thuộc về chủ đề này để tránh dữ liệu mồ côi
    await deleteMany("vocabularies", { categoryId: id, userId: req.user.uid });

    res.json({ success: true, message: "Đã xóa chủ đề và các từ vựng liên quan." });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa chủ đề." });
  }
});


// --- VOCABULARY API ROUTES ---

// Lấy danh sách từ vựng của người dùng
app.get("/api/vocab", authenticateToken, async (req: any, res) => {
  try {
    const vocab = await findMany("vocabularies", { userId: req.user.uid });
    res.json({ vocabularies: vocab });
  } catch (error) {
    console.error("Fetch vocab error:", error);
    res.status(500).json({ error: "Không thể lấy danh sách từ vựng." });
  }
});

// Thêm từ vựng mới
app.post("/api/vocab", authenticateToken, async (req: any, res) => {
  const { deutsch, vietnamesisch, article, plural, exampleDe, exampleVi, categoryId, status } = req.body;

  if (!deutsch || !vietnamesisch || !categoryId) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tiếng Đức, nghĩa tiếng Việt và chọn chủ đề." });
  }

  try {
    const id = "vocab_" + Math.random().toString(36).substring(2, 15);
    const newVocab = {
      id,
      userId: req.user.uid,
      deutsch: deutsch.trim(),
      vietnamesisch: vietnamesisch.trim(),
      article: article || "none",
      plural: plural ? plural.trim() : "",
      exampleDe: exampleDe ? exampleDe.trim() : "",
      exampleVi: exampleVi ? exampleVi.trim() : "",
      categoryId,
      status: status || "learning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await insertOne("vocabularies", newVocab);
    res.status(201).json({ vocabulary: newVocab });
  } catch (error) {
    console.error("Create vocab error:", error);
    res.status(500).json({ error: "Không thể lưu từ vựng mới." });
  }
});

// Cập nhật từ vựng
app.put("/api/vocab/:id", authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const snap = await findOne("vocabularies", { id });

    if (!snap || snap.userId !== req.user.uid) {
      return res.status(403).json({ error: "Bạn không có quyền chỉnh sửa từ vựng này." });
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await updateOne("vocabularies", { id }, updatedData);
    res.json({ success: true, vocabulary: { ...snap, ...updatedData } });
  } catch (error) {
    console.error("Update vocab error:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi cập nhật từ vựng." });
  }
});

// Xóa từ vựng
app.delete("/api/vocab/:id", authenticateToken, async (req: any, res) => {
  const { id } = req.params;

  try {
    const snap = await findOne("vocabularies", { id });

    if (!snap || snap.userId !== req.user.uid) {
      return res.status(403).json({ error: "Bạn không có quyền xóa từ vựng này." });
    }

    await deleteOne("vocabularies", { id });
    res.json({ success: true, message: "Đã xóa từ vựng thành công." });
  } catch (error) {
    console.error("Delete vocab error:", error);
    res.status(500).json({ error: "Lỗi hệ thống khi xóa từ vựng." });
  }
});


// --- PHÂN TÍCH CHỦ ĐỀ & TỪ VỰNG TỰ ĐỘNG ---

app.post("/api/ai/analyze", authenticateToken, async (req: any, res) => {
  const { word } = req.body;

  if (!word || word.trim() === "") {
    return res.status(400).json({ error: "Vui lòng nhập từ vựng tiếng Đức để phân tích." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Hệ thống chưa cấu hình Khóa Phân Tích (API Key). Vui lòng thêm GEMINI_API_KEY trong phần Secrets."
    });
  }

  try {
    // Khởi tạo SDK phân tích
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Bạn là một trợ lý giảng dạy tiếng Đức chuyên nghiệp và chu đáo. Hãy phân tích từ hoặc cụm từ tiếng Đức sau đây: "${word.trim()}".
Phản hồi của bạn BẮT BUỘC phải là một đối tượng JSON hợp lệ duy nhất, có cấu trúc chính xác như sau và tuyệt đối không thêm bớt các thuộc tính khác:
{
  "deutsch": "từ tiếng Đức đã được chuẩn hóa (ví dụ: viết hoa đúng chuẩn nếu là danh từ, bỏ đi các tiền tố không cần thiết)",
  "article": "der" hoặc "die" hoặc "das" hoặc "none" (chỉ ghi "der"/"die"/"das" nếu từ đó là danh từ số ít xác định giống ngữ pháp, còn lại tất cả các từ loại khác như động từ, tính từ, trạng từ hay đại từ thì ghi "none"),
  "plural": "dạng số nhiều của danh từ kèm theo quán từ 'die' (ví dụ: 'die Kinder' cho đứa trẻ), hoặc bỏ trống/ghi chuỗi rỗng nếu từ đó không phải là danh từ hoặc không có dạng số nhiều thông dụng",
  "vietnamesisch": "nghĩa tiếng Việt chính xác và phổ biến nhất của từ này",
  "exampleDe": "một câu ví dụ tiếng Đức đơn giản, trực quan và hữu dụng chứa từ vừa nhập",
  "exampleVi": "bản dịch tiếng Việt chính xác, tự nhiên của câu ví dụ tiếng Đức ở trên",
  "explanation": "giải thích ngắn gọn (khoảng 1-2 câu) về từ loại, cách dùng hoặc lưu ý đặc biệt đối với từ này trong tiếng Đức"
}

Hãy phân tích chính xác, chân thực và trả về đúng định dạng JSON được yêu cầu.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ máy chủ phân tích.");
    }

    try {
      const parsedData = JSON.parse(text);
      res.json({ result: parsedData });
    } catch (parseError) {
      console.error("Failed to parse analysis response text:", text);
      // Fallback if parsing failed
      res.status(500).json({ error: "Dữ liệu phân tích không đúng định dạng. Hãy thử lại." });
    }
  } catch (error: any) {
    console.error("Analysis API error:", error);
    res.status(500).json({ error: "Lỗi kết nối với hệ thống phân tích: " + (error.message || "Unknown error") });
  }
});


// --- VITE MIDDLEWARE & STATIC FILE SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
