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
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="/dashboard/overview" element={<DashboardPage />} />

          <Route path="/dashboard/portfolios" element={<PortfoliosPage />} />
          <Route path="/dashboard/portfolios/:id" element={<PortfolioDetailPage />} />

          <Route path="/dashboard/properties" element={<PropertiesPage />} />
          <Route path="/dashboard/properties/:id" element={<PropertyDetailPage />} />

          <Route path="/dashboard/leases" element={<LeasesPage />} />
          <Route path="/dashboard/leases/upload" element={<LeaseUploadPage />} />
          <Route path="/dashboard/leases/:id" element={<LeaseDetailPage />} />

          <Route path="/dashboard/discrepancies" element={<DiscrepanciesPage />} />
          <Route path="/dashboard/discrepancies/:id" element={<DiscrepancyDetailPage />} />

          <Route path="/dashboard/cam-reconciliations" element={<CAMReconciliationsPage />} />
          <Route path="/dashboard/cam-reconciliations/:id" element={<CAMDetailPage />} />

          <Route path="/dashboard/calendar" element={<CalendarPage />} />

          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/reports/:id" element={<ReportDetailPage />} />

          <Route path="/dashboard/documents" element={<DocumentsPage />} />

          <Route path="/dashboard/invoices" element={<InvoicesPage />} />

          <Route path="/dashboard/exports" element={<ExportsPage />} />
          <Route path="/dashboard/exports/new" element={<NewExportPage />} />

          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
