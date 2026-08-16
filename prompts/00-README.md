# Thư mục prompts — cách dùng

Thứ tự chạy, KHÔNG đảo:

1. `01-audit-and-fix-bugs.md` — rà soát + sửa lỗi bản prototype v1.0 hiện có.
2. `02-align-uiux-v1.2.md` — sau khi (1) xong và đã duyệt, chỉnh UI/UX khớp PRD v1.2.

Mỗi file là một prompt độc lập, copy nguyên văn dán vào khung chat của Claude Code. Không cần dán `CLAUDE.md` — Claude Code tự đọc file đó ở root repo mỗi phiên.

Sau khi cả 2 bước xong → đây là mốc "sửa lại đúng UI/UX gửi chú Quốc" theo chỉ đạo. Các việc sau (nối DB thật, 7 engine lõi) thuộc đợt sau, sẽ có prompt riêng khi tới lúc, đặt tại `03-...` trở đi.
