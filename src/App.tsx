import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

import { DashboardPage } from '@/pages/DashboardPage';
import { LeasesPage } from '@/pages/leases/LeasesPage';
import { LeaseDetailPage } from '@/pages/leases/LeaseDetailPage';
import { LeaseUploadPage } from '@/pages/leases/LeaseUploadPage';
import { DiscrepanciesPage } from '@/pages/discrepancies/DiscrepanciesPage';
import { DiscrepancyDetailPage } from '@/pages/discrepancies/DiscrepancyDetailPage';
import { CAMReconciliationsPage } from '@/pages/cam-reconciliations/CAMReconciliationsPage';
import { CAMDetailPage } from '@/pages/cam-reconciliations/CAMDetailPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { ReportDetailPage } from '@/pages/reports/ReportDetailPage';
import { PropertiesPage, PropertyDetailPage } from '@/pages/PropertiesPage';
import { PortfoliosPage, PortfolioDetailPage } from '@/pages/PortfoliosPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ExportsPage, NewExportPage } from '@/pages/ExportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { InvoicesPage } from '@/pages/InvoicesPage';

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/portfolios" element={<PortfoliosPage />} />
          <Route path="/portfolios/:id" element={<PortfolioDetailPage />} />

          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />

          <Route path="/leases" element={<LeasesPage />} />
          <Route path="/leases/upload" element={<LeaseUploadPage />} />
          <Route path="/leases/:id" element={<LeaseDetailPage />} />

          <Route path="/discrepancies" element={<DiscrepanciesPage />} />
          <Route path="/discrepancies/:id" element={<DiscrepancyDetailPage />} />

          <Route path="/cam-reconciliations" element={<CAMReconciliationsPage />} />
          <Route path="/cam-reconciliations/:id" element={<CAMDetailPage />} />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />

          <Route path="/documents" element={<DocumentsPage />} />

          <Route path="/invoices" element={<InvoicesPage />} />

          <Route path="/exports" element={<ExportsPage />} />
          <Route path="/exports/new" element={<NewExportPage />} />

          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
