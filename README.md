# 🌘 Reading Mode — "Tìm em, tìm em trong bóng đêm.."

Userscript giảm độ tối màn hình để bảo vệ mắt khi đọc trong môi trường tối, kèm bộ lọc ánh sáng vàng, chế độ tập trung và auto-scroll để đọc truyện.

## ✨ Tính năng

- **🌙 Chế độ tối** — phủ một lớp tối lên trang, điều chỉnh độ đậm từ 0–90%.
- **🟡 Lọc ánh sáng** — phủ lớp vàng ấm (giảm ánh sáng xanh), điều chỉnh 0–100%.
- **🧘 Tập trung** — ẩn header, footer, sidebar, quảng cáo, banner. Theo dõi cả nội dung tải động (lazy-load / cuộn vô hạn).
- **▶️ Auto-scroll** — tự động cuộn để đọc truyện, tốc độ 10–600 px/giây, cuộn mượt bằng `requestAnimationFrame`. Tự dừng khi chạm đáy trang.
- **🎛️ Panel kéo thả** — bảng điều khiển nhỏ gọn, kéo được, ghi nhớ vị trí. Mở/đóng bằng nút 🌘 ở góc dưới phải.
- Mọi cài đặt (độ tối, tốc độ, vị trí panel...) được **lưu lại** qua `localStorage`.

## ⌨️ Phím tắt

| Phím | Chức năng |
|------|-----------|
| `S` | Bật / tắt auto-scroll |
| `]` | Tăng tốc độ cuộn (+20 px/s) |
| `[` | Giảm tốc độ cuộn (−20 px/s) |

Phím tắt tự động vô hiệu khi con trỏ đang ở trong ô nhập liệu (input / textarea), nên không kích hoạt nhầm khi đang gõ.

## ⚙️ Tùy chỉnh phím tắt

Mở đầu script có khối `KEYS` để bạn đổi phím ngay tại đó:

```javascript
const KEYS = {
    toggleScroll: 's',   // bật/tắt auto-scroll
    speedUp:      ']',   // tăng tốc độ
    speedDown:    '['    // giảm tốc độ
};
```

- Ký tự thường: ghi 1 ký tự — `'s'`, `'p'`, `'d'`...
- Phím đặc biệt: dùng tên `event.key` viết thường — `'arrowup'`, `'arrowdown'`, `'arrowleft'`, `'arrowright'`, `'enter'`, `'escape'`, `' '` (phím cách).
- Đặt `''` để tắt một phím tắt.

Dòng gợi ý phím trong panel sẽ tự cập nhật theo cấu hình này.

## 📦 Cài đặt

> Cần cài **[Tampermonkey](https://www.tampermonkey.net/)** hoặc **[Violentmonkey](https://violentmonkey.github.io/)** trước.

**[👉 Bấm vào đây để cài đặt](https://raw.githubusercontent.com/azuzuzuzuzu/READING-MODE/main/script.user.js)**

Khi đã cài sẵn Tampermonkey/Violentmonkey, bấm link trên sẽ mở thẳng trang cài đặt với nút **Install**. Sau khi cài, script tự chạy trên mọi trang — bấm nút 🌘 ở góc dưới phải để mở bảng điều khiển.

<details>
<summary>Cài thủ công (nếu link trên không hoạt động)</summary>

1. Mở tiện ích → **Create a new script** (Tạo script mới).
2. Xóa nội dung mẫu, dán toàn bộ nội dung file [`script.user.js`](script.user.js) vào.
3. Nhấn **Ctrl + S** để lưu.

</details>

## 📝 Ghi chú

- Tốc độ auto-scroll mặc định: **60 px/giây** (chậm, hợp đọc truyện).
- Khoảng tốc độ: **10–600 px/giây**, mỗi lần nhấn `[` / `]` thay đổi 20 px/giây.
- UI chỉ hiển thị ở frame trên cùng — không bị nạp trùng trong iframe (khung quảng cáo, video nhúng...).
- Auto-scroll tự khởi động lại sau khi reload nếu trước đó đang bật.

## 📄 Giấy phép

Phát hành theo [giấy phép MIT](LICENSE).
