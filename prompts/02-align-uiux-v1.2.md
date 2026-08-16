# Prompt 2 — Chỉnh lại UI/UX cho khớp PRD v1.2 (sau khi đã sửa lỗi ở Prompt 1)

> Chỉ chạy prompt này SAU khi đã hoàn tất và duyệt xong Prompt 1. Copy toàn bộ nội dung dưới đây dán vào Claude Code.
> File PRD v1.2 đầy đủ đã đặt tại `docs/prd/PRD-HNX-IMS-ICDS-v1_2.md` trong repo — đọc file đó khi cần chi tiết, prompt này chỉ tóm tắt phần liên quan đến frontend.

---

Bạn là lập trình viên frontend chính của dự án. PRD đã được cập nhật từ v1.0 lên **v1.2** sau khi đối chiếu 100% với URD gốc. Nhiệm vụ đợt này: **chỉnh lại UI/UX hiện có cho khớp với các điểm đã đổi ở v1.2**, vẫn ở mức prototype (mock data, chưa nối backend thật). Không code engine, không đổi kiến trúc lớn.

## Danh sách các điểm đã đổi cần rà và sửa trên UI

### A. Tên sản phẩm & thuật ngữ hiển thị
- Tên hệ thống chính thức theo URD là **IMS/ICDS** (Hệ thống tiếp nhận, quản lý khai thác và công bố thông tin doanh nghiệp). Nếu UI hiện tại hiển thị "HNX-CIS" ở header/title/footer/trang login, đổi nhãn hiển thị cho đúng (giữ tên biến/code cũ trong source nếu đổi sẽ ảnh hưởng lớn — chỉ đổi phần **hiển thị cho người dùng**).

### B. Vai trò người dùng — bổ sung P.CNTT
- UI phân quyền/quản lý tài khoản/dropdown chọn vai trò phải có đủ danh sách vai trò ở `CLAUDE.md` mục 5, đặc biệt bổ sung **Chuyên viên P.CNTT** và **Lãnh đạo P.CNTT** nếu đang thiếu.

### C. Hai picklist trạng thái khác nhau — điểm dễ nhầm nhất, ưu tiên cao
Đây là lỗi nghiêm trọng nhất PRD v1.0 mắc phải: **có 2 danh mục trạng thái khác nhau, không phải 1.**

1. **Trạng thái chứng khoán** (hiển thị trong hồ sơ cổ phiếu/trái phiếu) — **5 giá trị**: dùng đúng 5 giá trị theo state machine chứng khoán (xem mục 5.6.1 trong PRD v1.2 nếu cần đối chiếu), **không** thêm giá trị lạ như "Hạn chế giao dịch" vào picklist này.
2. **Trạng thái kiểm soát** (hiển thị trong bản ghi diện giám sát/rà soát) — **9 giá trị riêng**, trong đó có "Hạn chế giao dịch". Đây là danh mục khác, không trộn với (1).

➡️ Rà lại toàn bộ dropdown/badge/tag trạng thái trong UI: nếu đang dùng chung một danh sách 5 hoặc 6 giá trị cho cả hai màn hình, tách thành hai danh mục riêng, đặt tên rõ ràng trong code (ví dụ `SECURITY_STATUS` vs `SURVEILLANCE_STATUS`) để tránh tái diễn nhầm lẫn.

### D. Cấu hình mẫu báo cáo — 4 cờ, không phải 3
Màn hình cấu hình mẫu báo cáo (nếu có ở prototype) đang có 3 cờ (`auto_approve`, `require_ca_sign`, `post_audit`). Theo v1.2 phải có **4 cờ tách riêng hai cấp tự động duyệt**, cộng thêm 2 cờ nữa:
- Lãnh đạo tự động duyệt
- Chuyên viên tự động duyệt
- Ký CA
- Hậu kiểm tin
- (thêm) Công bố
- (thêm) Kích hoạt

Cập nhật form cấu hình và bảng danh sách mẫu báo cáo cho đủ các cờ này (mock data, chưa cần logic thật).

### E. Biểu mẫu Mẫu số 01 → 06 — tên chính xác
Nếu UI có màn hình xem/kết xuất biểu mẫu theo trạng thái hồ sơ ĐKGD, dùng đúng tên:
- Mẫu 01: Công văn yêu cầu bổ sung, chỉnh sửa hồ sơ ĐKGD
- Mẫu 02: Thông báo dừng xem xét hồ sơ ĐKGD
- Mẫu 03: Báo cáo tổng hợp hồ sơ ĐKGD cổ phiếu
- Mẫu 04: Quyết định về việc chấp thuận ĐKGD cổ phiếu
- Mẫu 05: Thông báo về việc chấp thuận ĐKGD cổ phiếu
- Mẫu 06: Thông báo ngày giao dịch đầu tiên và giá tham chiếu — lưu ý UI cần thể hiện ràng buộc "phải cập nhật Đã thanh toán phí mới mở nút trình duyệt" (có thể làm dạng disable nút + tooltip giải thích bằng tiếng Việt, dùng mock data).

### F. Tin công bố song ngữ VI/EN — MỘT vòng đời, không phải hai
Nếu UI hiện đang cho tạo/duyệt bản tin tiếng Anh như một tin độc lập, có workflow duyệt riêng — đây là **sai theo v1.2**. Đúng: hệ thống tự dịch sau khi bản VI được duyệt, chuyên viên chỉ **hiệu đính** bản dịch, rồi **công bố cùng lúc VI + EN** (một lần đăng, không phải 2 lần duyệt độc lập). Cập nhật lại luồng màn hình: sau khi duyệt bản VI → hiện bản EN ở dạng "đã dịch tự động, chờ hiệu đính" → hiệu đính → nút Công bố công bố cả 2 bản cùng lúc.

### G. Dashboard — đúng số lượng và hành vi widget
Nếu prototype có màn hình Dashboard, đối chiếu lại:

**Dashboard Doanh nghiệp — đúng 5 widget:**
1. Thống kê Báo cáo công bố (theo trạng thái: Đang chờ duyệt / Đã duyệt / Bị từ chối)
2. Tình trạng Báo cáo định kỳ (BCTC Quý, BCTC Bán niên, Báo cáo Thường niên, Báo cáo Quản trị × Đã nộp đúng hạn / Chưa nộp / **Quá hạn — cảnh báo đỏ**)
3. Danh sách Tin bị từ chối (kèm lý do từ chối)
4. Cảnh báo & Thông báo (từ HNX và UBCKNN, kèm hạn chót phản hồi)
5. Lịch sử công bố thông tin (dạng timeline)

**Dashboard Chuyên viên — đúng 7 widget:** Thống kê BCTC · Báo cáo Định kỳ khác · Báo cáo Bất thường · Báo cáo Giao dịch · Báo cáo Chào bán/Phát hành · Báo cáo theo yêu cầu · **Thống kê Công việc cá nhân** (số hồ sơ "Chờ tôi duyệt", số hồ sơ "Sắp quá hạn SLA xử lý nội bộ" — cảnh báo đỏ).

**Hành vi bắt buộc cho cả 2 dashboard (mock data vẫn phải thể hiện đúng hành vi UI):**
- Đổi bộ lọc (kể cả bộ lọc Sàn giao dịch: HOSE / HNX / UPCoM) → toàn bộ widget tự refresh cùng lúc.
- Click vào một lát cắt biểu đồ hoặc một con số → mở Grid View chi tiết đúng tập dữ liệu tạo nên con số đó (với mock data, tạo dữ liệu chi tiết khớp logic).
- Không có quyền xem chi tiết → ẩn link, không hiện lỗi phân quyền thô.
- Không có dữ liệu → hiện số 0 hoặc "Không có dữ liệu", không để trống trắng.
- Có nút Export Excel ở cả widget và Grid View.

### H. UX theo persona — nhắc lại để không làm ngược
- Màn hình cho **Chuyên viên P.QLNY**: ưu tiên bảng dữ liệu dày đặc, thao tác nhanh bằng bàn phím, không cần làm đẹp quá mức.
- Màn hình duyệt tin của **Lãnh đạo P.TTTT**: phải dùng được trên điện thoại (responsive), hỗ trợ duyệt hàng loạt, xem nhanh diff giữa bản gốc/bản sửa nếu có màn hình đó.
- Màn hình cho **Chuyên viên doanh nghiệp**: UI đơn giản, thông báo lỗi tiếng Việt dễ hiểu, có dashboard "tôi đang nợ gì, hạn nào".
- Website Corporate News (nếu có trong repo này): bắt buộc responsive, ưu tiên mobile-first (60%+ nhà đầu tư truy cập bằng điện thoại).

## Ràng buộc

- Vẫn dùng mock data, KHÔNG nối API thật trong đợt này.
- KHÔNG đổi kiến trúc thư mục lớn nếu không cần thiết.
- Trước khi sửa, liệt kê rõ những màn hình/component nào bị ảnh hưởng theo từng mục A→H ở trên, tôi xác nhận rồi mới sửa.
- Sau khi sửa xong mỗi mục, báo cáo ngắn gọn theo đúng định dạng ở Prompt 1.

## Việc CHƯA làm ở đợt này (chỉ ghi chú, không code)
- Form Engine / DynamicForm thật, Workflow Engine, Rule Engine, Document Engine, AuthZ Engine, Audit Engine, Report Engine ở backend.
- Nối database thật.
- 111 mẫu báo cáo thống kê đầy đủ (chỉ cần khung UI + mock, không cần đủ cả 111 mẫu).
