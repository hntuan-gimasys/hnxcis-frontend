/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, AlertTriangle, KeyRound, Lock } from 'lucide-react';
/*
  Bản logo MÀU TỐI, không phải bản trắng dùng ở header.

  `hnx-logo.png` là chữ trắng trên nền trong suốt — đặt lên cột form nền trắng của
  màn này thì tàng hình hoàn toàn (đã kiểm: 100% pixel vùng logo là trắng tinh).
  `hnx-logo-dark.png` là cùng ảnh đó tô lại thành #2f6b1d, giữ nguyên alpha nên
  viền vẫn mượt.
*/
import hnxLogoDark from '../../assets/hnx-logo-dark.png';
import hnxBuilding from '../../assets/hnx.jpeg';
import type { UserAccount, SecurityPolicy } from '../../types/hnx';

/**
 * FR-060 · Màn hình đăng nhập và các ràng buộc bảo mật khi đăng nhập.
 *
 * Trước đây hệ thống không có màn đăng nhập nào — người dùng được chuyển bằng
 * dropdown đổi persona ở header, nghĩa là ba chức năng P0 (FR-055 đăng ký tài
 * khoản, FR-059 bảo mật tài khoản, FR-060 bảo mật đăng nhập) không có gì để rà.
 *
 * Màn này thi hành thật các ràng buộc do chính sách bảo mật cấu hình:
 *   - Đếm số lần sai và khóa tài khoản khi vượt ngưỡng (không chỉ báo lỗi rồi thôi).
 *   - Bắt bước xác thực hai yếu tố với các vai trò được cấu hình đòi MFA.
 *   - Ghi lại lý do thất bại để nhật ký đăng nhập có cái mà hiển thị.
 *
 * Mật khẩu ở prototype này không được kiểm tra thật (chưa có backend xác thực);
 * ô mật khẩu chỉ cần khác rỗng. Điều đó được nói thẳng trên giao diện thay vì để
 * người dùng tưởng đã có kiểm soát thật.
 *
 * KHÔNG có nút chuyển "người dùng nội bộ / bên ngoài".
 *
 * Bản thiết kế lại của màn này (4e502a8) từng có nút đó để lọc danh sách tài khoản
 * gợi ý. Nó bị bỏ khi ba cổng tách thành ba địa chỉ riêng: màn này chỉ phục vụ
 * /ims — khu vực nghiệp vụ nội bộ của HNX. Cổng doanh nghiệp ICDS nằm ở /icds và
 * vào tự do, không qua đây. Giữ lại nút sẽ ngụ ý tài khoản doanh nghiệp đăng nhập
 * được ở đây, trong khi `submitCredentials` bên dưới từ chối đúng những tài khoản
 * đó — hai chỗ nói ngược nhau.
 */

interface LoginScreenProps {
  users: UserAccount[];
  policy: SecurityPolicy;
  onAuthenticated: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, policy, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [pendingUser, setPendingUser] = useState<UserAccount | null>(null);
  const [failedCount, setFailedCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const lockMinutesLeft = lockedUntil ? Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000)) : 0;

  const registerFailure = (reason: string) => {
    const next = failedCount + 1;
    setFailedCount(next);
    if (next >= policy.maxFailedAttempts) {
      setLockedUntil(Date.now() + policy.lockoutMinutes * 60000);
      setError(
        `Đã sai ${next}/${policy.maxFailedAttempts} lần. Tài khoản bị khóa ${policy.lockoutMinutes} phút theo chính sách bảo mật.`,
      );
    } else {
      setError(`${reason} (lần ${next}/${policy.maxFailedAttempts})`);
    }
  };

  const submitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const found = users.find((u) => u.username === username.trim());
    if (!found) {
      registerFailure('Tên đăng nhập hoặc mật khẩu không đúng.');
      return;
    }
    if (!password) {
      registerFailure('Tên đăng nhập hoặc mật khẩu không đúng.');
      return;
    }
    if (found.status !== 'ACTIVE') {
      setError(`Tài khoản đang ở trạng thái ${found.status} — không đăng nhập được. Liên hệ quản trị hệ thống.`);
      return;
    }
    /**
     * IMS là khu vực nghiệp vụ nội bộ của HNX. Tài khoản doanh nghiệp không vào
     * đây — ICDS đã tách thành cổng riêng và vào tự do, nên chỉ đường sang đó
     * thay vì báo "sai mật khẩu" và để người dùng thử lại vô ích.
     */
    if (found.actorType !== 'HNX') {
      setError(
        'Tài khoản này thuộc doanh nghiệp, không dùng cho cổng nội bộ IMS. ' +
          'Cổng doanh nghiệp ICDS ở địa chỉ /icds và không cần đăng nhập.',
      );
      return;
    }

    setError(null);
    setFailedCount(0);

    if (policy.mfaRequiredForRoles.includes(found.roleCode)) {
      setPendingUser(found);
      setStage('MFA');
      return;
    }
    onAuthenticated(found);
  };

  const submitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    // Prototype: chấp nhận mọi mã 6 chữ số. Backend thật sẽ đối chiếu TOTP.
    if (!/^\d{6}$/.test(otp.trim())) {
      registerFailure('Mã xác thực phải gồm 6 chữ số.');
      return;
    }
    onAuthenticated(pendingUser);
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={hnxBuilding}
          alt="Trụ sở Sở Giao dịch Chứng khoán Hà Nội"
          className="absolute inset-0 h-full w-full object-cover rounded-tr-[48px] rounded-br-[48px]"
        />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10">
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto lg:mr-24">
          <div className="flex items-center gap-2 mb-10">
            <img src={hnxLogoDark} alt="Sở Giao dịch Chứng khoán Hà Nội" className="h-9 w-auto" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {stage === 'CREDENTIALS' ? 'Đăng nhập' : 'Xác thực hai yếu tố'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {stage === 'CREDENTIALS'
              ? 'Vui lòng đăng nhập để truy cập tài khoản'
              : `Vai trò ${pendingUser?.roleCode} yêu cầu xác thực hai yếu tố. Nhập mã 6 chữ số từ ứng dụng xác thực.`}
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-rose-50 border border-rose-300 rounded-md text-[11px] text-rose-900 leading-relaxed">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-slate-100 border border-slate-300 rounded-md text-[11px] text-slate-800">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Tài khoản đang bị khóa. Thử lại sau khoảng {lockMinutesLeft} phút.</span>
            </div>
          )}

          {stage === 'CREDENTIALS' ? (
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">
                  Thông tin đăng nhập <span className="text-rose-600">*</span>
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLocked}
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-hnx-mid/40 focus:border-hnx-mid disabled:bg-slate-100"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1.5">
                  Mật khẩu <span className="text-rose-600">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-hnx-mid/40 focus:border-hnx-mid disabled:bg-slate-100"
                  placeholder="Nhập mật khẩu"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Chính sách hiện hành: tối thiểu {policy.passwordMinLength} ký tự
                  {policy.passwordRequireUppercase && ', có chữ hoa'}
                  {policy.passwordRequireDigit && ', có chữ số'}
                  {policy.passwordRequireSymbol && ', có ký tự đặc biệt'}; đổi mỗi{' '}
                  {policy.passwordExpiryDays} ngày.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setRememberMe((v) => !v)}
                  disabled={isLocked}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      rememberMe ? 'bg-hnx-mid' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        rememberMe ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  Ghi nhớ
                </button>
                <button
                  type="button"
                  onClick={() => alert('Chức năng khôi phục mật khẩu chưa được triển khai ở prototype này.')}
                  className="text-sm font-medium text-hnx-mid hover:text-hnx-deep"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-hnx-gradient text-white text-sm font-semibold disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Mã xác thực</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 text-lg font-mono tracking-[0.4em] text-center bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-hnx-mid/40 focus:border-hnx-mid"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-hnx-gradient text-white text-sm font-semibold"
              >
                <KeyRound className="h-4 w-4" />
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => {
                  setStage('CREDENTIALS');
                  setPendingUser(null);
                  setOtp('');
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Quay lại
              </button>
            </form>
          )}

          {/*
            Giữ bố cục của bản thiết kế lại (khối nằm trong cột form, có đường kẻ
            phân cách), nhưng chỉ liệt kê tài khoản HNX: IMS là cổng nội bộ, còn
            ICDS đã tách thành địa chỉ riêng và vào tự do nên không cần tài khoản.
          */}
          {stage === 'CREDENTIALS' && (
            <div className="mt-8 pt-5 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tài khoản nội bộ thử nghiệm
              </p>
              <div className="flex flex-wrap gap-1.5">
                {users
                  .filter((u) => u.actorType === 'HNX')
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setUsername(u.username);
                        setPassword('demo-password');
                        setError(null);
                      }}
                      className="px-2 py-1 rounded-sm bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 hover:border-hnx-mid hover:text-hnx-deep"
                    >
                      {u.username}
                    </button>
                  ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Prototype chưa nối backend xác thực nên mật khẩu không được kiểm tra thật — chỉ cần khác rỗng.
                Ràng buộc số lần sai, khóa tài khoản và xác thực hai yếu tố thì có hiệu lực thật.
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                Chỉ cổng nội bộ <strong>IMS</strong> yêu cầu đăng nhập. Hai cổng còn lại vào tự do:
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                  <a href="/icds" className="text-hnx-mid hover:underline">/icds — Cổng Doanh nghiệp</a>
                  <a href="/news" className="text-hnx-mid hover:underline">/news — Corporate News</a>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center lg:text-right w-full max-w-md mx-auto lg:mx-0 lg:ml-auto lg:mr-24">
          © 2026 Sở Giao dịch Chứng khoán Hà Nội (HNX)
        </p>
      </div>
    </div>
  );
};
