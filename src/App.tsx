import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ChangeDepartmentPage } from './pages/ChangeDepartmentPage';
import { SubmitLeavePage } from './pages/SubmitLeavePage';
import { LeaveHistoryPage } from './pages/LeaveHistoryPage';
import { LeaveCalendarPage } from './pages/LeaveCalendarPage';
import { BriefingSessionsPage } from './pages/BriefingSessionsPage';
import { TakeAttendancePage } from './pages/TakeAttendancePage';
import { AttendanceSummaryPage } from './pages/AttendanceSummaryPage';
import { FollowUpSchedulerPage } from './pages/FollowUpSchedulerPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/AdminDepartmentsPage';
import { AdminTemplatesPage } from './pages/AdminTemplatesPage';
import { LogsPage } from './pages/LogsPage';

const AppContent: React.FC = () => {
  const { currentUser, isRegistering } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    if (params) {
      setPageParams(params);
    } else {
      setPageParams({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth flow protection
  if (!currentUser) {
    if (isRegistering) {
      return <RegisterPage onNavigate={handleNavigate} />;
    }
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'profile':
        return <UserProfilePage onNavigate={handleNavigate} />;

      case 'change-department':
        return <ChangeDepartmentPage onNavigate={handleNavigate} />;

      case 'submit-leave':
        return <SubmitLeavePage onNavigate={handleNavigate} />;

      case 'leave-history':
        return <LeaveHistoryPage onNavigate={handleNavigate} />;

      case 'leave-calendar':
        return <LeaveCalendarPage onNavigate={handleNavigate} />;

      case 'briefings':
        return <BriefingSessionsPage onNavigate={handleNavigate} />;

      case 'take-attendance':
        return (
          <TakeAttendancePage
            onNavigate={handleNavigate}
            selectedSessionId={pageParams?.sessionId}
          />
        );

      case 'attendance-summary':
        return (
          <AttendanceSummaryPage
            onNavigate={handleNavigate}
            sessionId={pageParams?.sessionId}
          />
        );

      case 'followup-scheduler':
        return (
          <FollowUpSchedulerPage
            onNavigate={handleNavigate}
            sessionId={pageParams?.sessionId}
          />
        );

      case 'admin-users':
        return <AdminUsersPage />;

      case 'admin-departments':
        return <AdminDepartmentsPage />;

      case 'admin-templates':
        return <AdminTemplatesPage />;

      case 'logs':
        return <LogsPage />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        {/* Main Content Stage */}
        <main className="flex-1 min-w-0">
          {renderPage()}
        </main>
      </div>

      {/* Corporate Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LeavePlan & Attendance Hub &copy; 2026. All rights reserved.</span>
          <span className="font-mono text-[11px]">System Status: Online | Role: {currentUser.role}</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
