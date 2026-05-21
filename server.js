const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware cấu hình CORS và ép kiểu dữ liệu JSON
app.use(cors());
app.use(bodyParser.json());

// 1. PHÂN PHỐI GIAO DIỆN STATIC (Giải quyết triệt để lỗi Cannot GET /)
// Định nghĩa thư mục chứa các file tĩnh (CSS, JS, hình ảnh nếu có)
app.use(express.static(__dirname));

// Khi người dùng truy cập trang chủ, trả về file index.html nằm cùng cấp với server.js
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 2. LOGIC BACKEND (DATA & API XỬ LÝ ĐIỂM)

// Giả lập Database lưu trữ trong RAM bộ nhớ tạm
let userDatabase = {}; 

// Kho dữ liệu link thật lưu an toàn ở Backend (Ẩn link Drive gốc)
const SECRET_FILE_STORE = {
    "file_lq_01": "https://omg10.com/4/11036217",
    "file_ielts_02": "https://omg10.com/4/11036281"
};

// Cấu hình điểm thưởng cho từng Task tương ứng với frontend
const TASK_REWARDS = {
    "task_ad_01": 30,
    "task_ad_02": 20
};

// API 1: Lấy thông tin điểm của User dựa trên TelegramID
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    if (!userDatabase[userId]) {
        userDatabase[userId] = { points: 0, completedTasks: [] }; // Khởi tạo nếu là user mới
    }
    res.json({ points: userDatabase[userId].points });
});

// API 2: Xử lý cộng điểm khi User hoàn thành nhiệm vụ click Smartlink (Ý tưởng B)
app.post('/api/complete-task', (req, res) => {
    const { userId, taskId } = req.body;
    
    if (!userDatabase[userId]) {
        userDatabase[userId] = { points: 0, completedTasks: [] };
    }

    const reward = TASK_REWARDS[taskId] || 10;
    
    // Cộng điểm cho user
    userDatabase[userId].points += reward;
    
    res.json({ 
        success: true, 
        message: `Chúc mừng! Bạn được cộng +${reward} điểm vào tài khoản.`,
        currentPoints: userDatabase[userId].points 
    });
});

// API 3: Xử lý đổi điểm lấy Link Tải Thật (Ý tưởng A)
app.post('/api/get-download-link', (req, res) => {
    const { userId, fileId, price } = req.body;

    if (!userDatabase[userId] || userDatabase[userId].points < price) {
        return res.status(400).json({ error: "Bạn không đủ điểm! Hãy làm thêm nhiệm vụ phía dưới để kiếm điểm." });
    }

    // Kiểm tra xem fileId có tồn tại trong kho lưu trữ bí mật không
    const realDownloadUrl = SECRET_FILE_STORE[fileId];
    if (!realDownloadUrl) {
        return res.status(404).json({ error: "File này không tồn tại hoặc đã bị xóa." });
    }

    // Trừ điểm của User
    userDatabase[userId].points -= price;

    // Trả link thật về cho Frontend tự động mở ra cho User tải
    res.json({ 
        success: true, 
        downloadUrl: realDownloadUrl,
        remainingPoints: userDatabase[userId].points 
    });
});

// ==========================================
// 3. KHỞI CHẠY SERVER ĐỒNG BỘ CỔNG VỚI RENDER

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[OK] Server đang chạy ổn định tại cổng: ${PORT}`);
});
