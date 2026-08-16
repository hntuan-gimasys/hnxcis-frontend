# Prompt 1 — Rà soát và sửa lỗi bản prototype hiện tại (v1.0)

> Copy toàn bộ nội dung dưới đây và dán vào Claude Code (trong Antigravity) khi bắt đầu phiên làm việc.
> Đã có `CLAUDE.md` ở root repo — Claude Code sẽ tự đọc, không cần dán lại nội dung đó.

---

Bạn là lập trình viên frontend chính của dự án này. Đây là repo **frontend only**, đang ở mức **prototype** (UI + mock data + API skeleton, chưa có backend thật).

## Nhiệm vụ đợt này (CHỈ làm đúng phạm vi dưới, không hơn)

**Bước 1 — Rà soát trước, KHÔNG sửa gì vội:**

1. Đọc toàn bộ cấu trúc thư mục của repo (`src/`, các package/app nếu có kiến trúc micro-frontend).
2. Chạy thử ứng dụng ở local (đọc `package.json` để biết lệnh dev đúng), tự dò qua từng route/màn hình chính.
3. Liệt kê **toàn bộ lỗi cụ thể** bạn phát hiện, phân loại rõ:
   - **Lỗi runtime** (console error, crash trắng trang, route 404, component không render).
   - **Lỗi logic UI** (form submit không có phản hồi, validate sai/thiếu, nút bấm không hoạt động, state không cập nhật, loading vô hạn).
   - **Lỗi hiển thị** (layout vỡ, responsive lỗi, text tràn, thiếu loading/empty/error state).
   - **Lỗi dữ liệu mock** (mock data thiếu field, sai kiểu dữ liệu, sai định dạng ngày/số so với chuẩn Việt Nam).
   - **Cảnh báo build/TypeScript** (lỗi type, warning ESLint nghiêm trọng).
4. Với mỗi lỗi, ghi rõ: file, mô tả, mức độ ưu tiên (Cao / Trung bình / Thấp), và cách bạn định sửa.
5. Trình bày danh sách này cho tôi xem **trước**, chờ tôi xác nhận, rồi mới bắt đầu sửa. Nếu danh sách quá dài, ưu tiên nhóm theo module (ví dụ: nhóm màn hình Quản lý hồ sơ, nhóm màn hình Công bố thông tin, nhóm Đăng nhập/phân quyền...) để tôi duyệt từng nhóm.

**Bước 2 — Sau khi tôi xác nhận, sửa lỗi theo đúng danh sách đã duyệt:**

- Sửa từng nhóm một, không gộp quá nhiều thay đổi không liên quan vào cùng một lần commit.
- Sau mỗi nhóm sửa xong: build lại, kiểm tra không phát sinh lỗi TypeScript/console mới, rồi báo cáo ngắn gọn: đã sửa gì, còn gì chưa sửa được và vì sao.
- **Không** thêm tính năng mới ngoài phạm vi "sửa lỗi" — nếu trong lúc rà soát thấy thiếu tính năng (không phải lỗi mà là chưa làm), ghi vào mục riêng "Việc chưa làm, không thuộc phạm vi sửa lỗi" ở cuối báo cáo, không tự làm luôn.
- Giữ nguyên UI library và kiến trúc hiện có của repo (xem `CLAUDE.md` mục 3).

## Ràng buộc bắt buộc (nhắc lại từ CLAUDE.md, luôn áp dụng)

- Không sửa backend, không đổi API contract.
- Thông báo lỗi trong UI phải bằng tiếng Việt tự nhiên, nêu rõ trường sai.
- Mọi danh sách/bảng phải có đủ 3 trạng thái: loading / rỗng ("Không có dữ liệu") / lỗi.
- Hành động phá huỷ phải có xác nhận trước khi thực hiện.
- Định dạng ngày `dd/MM/yyyy`, số theo chuẩn Việt Nam.

## Định dạng báo cáo cuối phiên

```
## Đã sửa
- [Module] Mô tả lỗi → cách sửa (file: ...)

## Chưa sửa được / cần hỏi thêm
- ...

## Nghi ngờ do backend (không tự sửa)
- ...

## Việc phát hiện thêm nhưng ngoài phạm vi đợt này
- ...
```
