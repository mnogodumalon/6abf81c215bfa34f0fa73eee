import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import { WorkflowPlaceholders } from '@/components/WorkflowPlaceholders';
import AdminPage from '@/pages/AdminPage';
import KursleiterPage from '@/pages/KursleiterPage';
import TeilnehmerPage from '@/pages/TeilnehmerPage';
import KursePage from '@/pages/KursePage';
import AnmeldungenPage from '@/pages/AnmeldungenPage';
import PublicFormKursleiter from '@/pages/public/PublicForm_Kursleiter';
import PublicFormTeilnehmer from '@/pages/public/PublicForm_Teilnehmer';
import PublicFormKurse from '@/pages/public/PublicForm_Kurse';
import PublicFormAnmeldungen from '@/pages/public/PublicForm_Anmeldungen';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6abf81a487ca6e2d98591819" element={<PublicFormKursleiter />} />
              <Route path="public/6abf81a93f5063fd61de9826" element={<PublicFormTeilnehmer />} />
              <Route path="public/6abf81aa672363357804ecaa" element={<PublicFormKurse />} />
              <Route path="public/6abf81aae81d8ad02efba372" element={<PublicFormAnmeldungen />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<><div className="mb-8"><WorkflowPlaceholders /></div><DashboardOverview /></>} />
                <Route path="kursleiter" element={<KursleiterPage />} />
                <Route path="teilnehmer" element={<TeilnehmerPage />} />
                <Route path="kurse" element={<KursePage />} />
                <Route path="anmeldungen" element={<AnmeldungenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
