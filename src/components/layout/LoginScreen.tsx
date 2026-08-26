/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, LogIn, AlertTriangle, KeyRound, Lock } from 'lucide-react';
import hnxLogo from '../../assets/hnx-logo.png';
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
 */

interface LoginScreenProps {
  users: UserAccount[];
  policy: SecurityPolicy;
  onAuthenticated: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, policy, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-hnx-header flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={hnxLogo} alt="Sở Giao dịch Chứng khoán Hà Nội" className="h-10 w-auto" />
        </div>

        <div className="bg-white rounded-md shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {stage === 'CREDENTIALS' ? 'Đăng nhập hệ thống' : 'Xác thực hai yếu tố'}
            </h1>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-300 rounded-sm text-[11px] text-rose-900 leading-relaxed">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && (
            <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-slate-100 border border-slate-300 rounded-sm text-[11px] text-slate-800">
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Tài khoản đang bị khóa. Thử lại sau khoảng {lockMinutesLeft} phút.</span>
            </div>
          )}

          {stage === 'CREDENTIALS' ? (
            <form onSubmit={submitCredentials} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tên đăng nhập
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLocked}
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm disabled:bg-slate-100"
                  placeholder="vd: admin"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-sm disabled:bg-slate-100"
                  placeholder="••••••••••••"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Chính sách hiện hành: tối thiểu {policy.passwordMinLength} ký tự
                  {policy.passwordRequireUppercase && ', có chữ hoa'}
                  {policy.passwordRequireDigit && ', có chữ số'}
                  {policy.passwordRequireSymbol && ', có ký tự đặc biệt'}; đổi mỗi{' '}
                  {policy.passwordExpiryDays} ngày.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-hnx-gradient text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="p-6 space-y-4">
              <p className="text-xs text-slate-700 leading-relaxed">
                Vai trò <strong>{pendingUser?.roleCode}</strong> nằm trong danh sách bắt buộc xác thực hai yếu tố.
                Nhập mã 6 chữ số từ ứng dụng xác thực.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mã xác thực
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-3 py-2 text-lg font-mono tracking-[0.4em] text-center border border-slate-300 rounded-sm"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-hnx-gradient text-white text-xs font-bold uppercase tracking-widest"
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
                className="w-full text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                Quay lại
              </button>
            </form>
          )}

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tài khoản nội bộ thử nghiệm
            </p>
            {/*
              Chỉ liệt kê tài khoản HNX. Trước đây danh sách này trộn cả tài khoản
              doanh nghiệp, khiến người dùng tưởng phải đăng nhập mới vào được cổng
              doanh nghiệp — trong khi ICDS đã tách riêng và vào tự do.
            */}
            <div className="flex flex-wrap gap-1.5">
              {users.filter((u) => u.actorType === 'HNX').map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUsername(u.username);
                    setPassword('demo-password');
                    setError(null);
                  }}
                  className="px-2 py-1 rounded-sm bg-white border border-slate-300 text-[10px] font-mono text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                >
                  {u.username}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Prototype chưa nối backend xác thực nên mật khẩu không được kiểm tra thật — chỉ cần khác rỗng.
              Ràng buộc số lần sai, khóa tài khoản và xác thực hai yếu tố thì có hiệu lực thật.
            </p>

            <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              Chỉ cổng nội bộ <strong>IMS</strong> yêu cầu đăng nhập. Hai cổng còn lại vào tự do:
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                <a href="/icds" className="text-emerald-700 hover:underline">/icds — Cổng Doanh nghiệp</a>
                <a href="/news" className="text-emerald-700 hover:underline">/news — Corporate News</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
