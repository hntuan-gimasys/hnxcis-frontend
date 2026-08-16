/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  INITIAL_ORGANIZATIONS,
  INITIAL_SECURITIES,
  INITIAL_EQUITY_PROFILES,
  INITIAL_BOND_PROFILES,
  INITIAL_SUBMISSIONS,
  INITIAL_ALERTS,
  INITIAL_SURVEILLANCE_RECORDS,
  INITIAL_OBLIGATIONS,
  INITIAL_USERS,
  INITIAL_TEMPLATES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import {
  UserAccount,
  Submission,
  SubmissionStatus,
  AuditLog,
  NotificationItem,
  Alert,
  SurveillanceRecord,
  TemplateDefinition,
  FeeRecord,
} from './types/hnx';
import { notificationService } from './services/notificationService';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuditHistoryModal } from './components/common/AuditHistoryModal';
import { PublicCorporateNews } from './components/portals/PublicCorporateNews';
import { CorporatePortal } from './components/portals/CorporatePortal';
import { DashboardModule } from './components/modules/DashboardModule';
import { ListingModule } from './components/modules/ListingModule';
import { AiCenterModule } from './components/modules/AiCenterModule';
import { BondModule } from './components/modules/BondModule';
import { DisclosureModule } from './components/modules/DisclosureModule';
import { AdminModule } from './components/modules/AdminModule';

export default function App() {
  // Global State
  const [activePortal, setActivePortal] = useState<'internal' | 'corporate' | 'public'>('internal');
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  // Personas
  const [users] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(INITIAL_USERS[1]); // Cán bộ P.QLNY by default

  // Entities Data
  const [organizations] = useState(INITIAL_ORGANIZATIONS);
  const [securities] = useState(INITIAL_SECURITIES);
  const [equityProfiles] = useState(INITIAL_EQUITY_PROFILES);
  const [bondProfiles] = useState(INITIAL_BOND_PROFILES);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [alerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [surveillanceRecords] = useState<SurveillanceRecord[]>(INITIAL_SURVEILLANCE_RECORDS);
  const [obligations] = useState(INITIAL_OBLIGATIONS);
  const [templates, setTemplates] = useState<TemplateDefinition[]>(INITIAL_TEMPLATES);
  const [tasks] = useState([]);
  const [fees] = useState<FeeRecord[]>([
    {
      id: 1,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 1,
      versionNo: 1,
      isCurrent: true,
      feeSchemaId: 1, // Phí quản lý niêm yết thường niên
      organizationId: 1,
      securityId: 1,
      periodFrom: '2026-01-01',
      periodTo: '2026-12-31',
      calcBasisJson: { basis: 'ANNUAL_LISTING_FEE', year: 2026, dueDate: '2026-03-31' },
      calculatedAmount: 50000000,
      finalAmount: 50000000,
      calcMode: 'AUTO',
      paymentStatus: 'CONFIRMED',
    },
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Generate deadline notifications dynamically using NotificationService
  const deadlineNotifications = useMemo(() => {
    return notificationService.generateDeadlineNotifications(obligations);
  }, [obligations]);

  const allNotifications = useMemo(() => {
    return [...deadlineNotifications, ...notifications];
  }, [deadlineNotifications, notifications]);

  // Audit History Modal State
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditEntity, setAuditEntity] = useState<{ type: string; id: number; label: string }>({
    type: '',
    id: 0,
    label: '',
  });
  const [selectedAuditLogs, setSelectedAuditLogs] = useState<AuditLog[]>([]);

  // Workflow Handlers
  /** Ghi một dòng Audit Trail cho việc chuyển trạng thái hồ sơ (X3). */
  const logSubmissionTransition = (
    sub: Submission,
    action: AuditLog['action'],
    fromStatus: SubmissionStatus,
    afterJson: Record<string, any>,
    reason: string
  ) => {
    setAuditLogs((prev) => [
      {
        id: prev.reduce((max, l) => Math.max(max, l.id), 0) + 1,
        occurredAt: new Date().toISOString(),
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleCode,
        actorIp: '127.0.0.1',
        correlationId: `req-${Date.now()}`,
        entityType: 'SUBMISSION',
        entityId: sub.id,
        entityLabel: sub.submissionNo || `Hồ sơ ID #${sub.id}`,
        action,
        beforeJson: { status: fromStatus },
        afterJson,
        diffJson: { status: `${fromStatus} -> ${afterJson.status}` },
        reason,
        result: 'SUCCESS',
      },
      ...prev,
    ]);
  };

  /** Chuyên viên Sở soát xét xong: SUBMITTED -> REVIEWED (FR-039). */
  const handleReviewSubmission = (subId: number) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: 'REVIEWED', reviewedAt: new Date().toISOString() }
          : s
      )
    );
    logSubmissionTransition(sub, 'REVIEW', sub.status, { status: 'REVIEWED' }, 'Hoàn tất soát xét hồ sơ');
    alert('Đã hoàn tất soát xét, hồ sơ được trình Lãnh đạo Sở phê duyệt.');
  };

  const handleApproveSubmission = (subId: number, comment: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? { ...s, status: 'PUBLISHED', isPublic: true, approvedAt: now, publishedAt: now }
          : s
      )
    );
    logSubmissionTransition(
      sub,
      'PUBLISH',
      sub.status,
      { status: 'PUBLISHED', isPublic: true },
      comment || 'Chấp thuận công bố thông tin'
    );
    alert('Đã phê duyệt và công bố thông tin thành công!');
  };

  const handleRejectSubmission = (subId: number, reason: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'CANCELLED' } : s))
    );
    logSubmissionTransition(
      sub,
      'REJECT',
      sub.status,
      { status: 'CANCELLED' },
      reason || 'Từ chối phê duyệt'
    );
    alert('Đã từ chối hồ sơ và gửi thông báo yêu cầu đính chính!');
  };

  /** Gỡ tin đã công bố khỏi Corporate News, bắt buộc có lý do (FR-042). */
  const handleHideSubmission = (subId: number, reason: string) => {
    const sub = submissions.find((s) => s.id === subId);
    if (!sub) return;

    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              status: 'HIDDEN',
              isPublic: false,
              hiddenAt: now,
              hiddenBy: currentUser.id,
              hideReason: reason,
            }
          : s
      )
    );
    logSubmissionTransition(
      sub,
      'HIDE',
      sub.status,
      { status: 'HIDDEN', isPublic: false },
      reason || 'Gỡ tin đã công bố'
    );
    alert('Đã gỡ tin khỏi chuyên trang Công bố Thông tin công khai.');
  };

  const handleOpenAuditHistory = (type: string, id: number, label: string) => {
    const filtered = (auditLogs || []).filter(
      (log) => log.entityType === type && log.entityId === id
    );
    setSelectedAuditLogs(filtered);
    setAuditEntity({ type, id, label });
    setAuditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <Header
        activePortal={activePortal}
        setActivePortal={(portal) => {
          setActivePortal(portal);
          if (portal === 'corporate') {
            setActiveModule('corp_dashboard');
          } else if (portal === 'internal') {
            setActiveModule('dashboard');
          }
        }}
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={(u) => {
          setCurrentUser(u);
          if (u.actorType === 'ORGANIZATION') {
            setActivePortal('corporate');
            setActiveModule('corp_dashboard');
          } else if (u.actorType === 'HNX') {
            setActivePortal('internal');
            setActiveModule('dashboard');
          }
        }}
        notifications={allNotifications}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userRole={currentUser.roleCode}
          activePortal={activePortal}
        />

        {/* Content View */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activePortal === 'public' && (
            <PublicCorporateNews
              organizations={organizations}
              securities={securities}
              submissions={submissions}
              bonds={bondProfiles}
              lang={lang}
            />
          )}

          {activePortal === 'corporate' && (
            <CorporatePortal
              activeModule={activeModule}
              currentUser={currentUser}
              organizations={organizations}
              obligations={obligations}
              submissions={submissions}
              templates={templates}
              alerts={alerts}
              onSubmitNewFiling={(newSub) => {
                setSubmissions((prev) => [newSub, ...prev]);
                alert('Đã nộp báo cáo E-Form thành công sang Hàng đợi Sở HNX!');
              }}
            />
          )}

          {activePortal === 'internal' && (
            <>
              {activeModule === 'dashboard' && (
                <DashboardModule
                  submissions={submissions}
                  alerts={alerts}
                  obligations={obligations}
                  tasks={tasks}
                  currentUser={currentUser}
                  onNavigateToModule={(mod) => setActiveModule(mod)}
                />
              )}

              {activeModule === 'ai_center' && <AiCenterModule />}

              {activeModule.startsWith('qlny_') && (
                <ListingModule
                  activeModule={activeModule}
                  onChangeModule={setActiveModule}
                  organizations={organizations}
                  securities={securities}
                  equityProfiles={equityProfiles}
                  bondProfiles={bondProfiles}
                  alerts={alerts}
                  surveillanceRecords={surveillanceRecords}
                  fees={fees}
                  userRole={currentUser.roleCode}
                  onAuditHistory={handleOpenAuditHistory}
                />
              )}

              {activeModule.startsWith('tttp_') && (
                <BondModule
                  activeModule={activeModule}
                  onChangeModule={setActiveModule}
                  bonds={bondProfiles}
                  onAuditHistory={handleOpenAuditHistory}
                />
              )}

              {activeModule.startsWith('tttt_') && (
                <DisclosureModule
                  activeModule={activeModule}
                  submissions={submissions}
                  organizations={organizations}
                  alerts={alerts}
                  onReviewSubmission={handleReviewSubmission}
                  onApproveSubmission={handleApproveSubmission}
                  onRejectSubmission={handleRejectSubmission}
                  onHideSubmission={handleHideSubmission}
                  onAuditHistory={handleOpenAuditHistory}
                  currentUserId={currentUser.id}
                />
              )}

              {activeModule.startsWith('admin_') && (
                <AdminModule
                  activeModule={activeModule}
                  users={users}
                  currentUser={currentUser}
                  templates={templates}
                  onUpdateTemplate={(updated) =>
                    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Audit History Modal */}
      <AuditHistoryModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        entityType={auditEntity.type}
        entityId={auditEntity.id}
        entityLabel={auditEntity.label}
        auditLogs={selectedAuditLogs}
      />
    </div>
  );
}
