import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { Guard, ProtectedLayout } from './routes/guards';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';
import { HomeRedirect } from './pages/Dashboard';

const People = lazy(() => import('./pages/People'));
const PersonProfile = lazy(() => import('./pages/PersonProfile'));
const Wards = lazy(() => import('./pages/Wards'));
const WardDetails = lazy(() => import('./pages/WardDetails'));
const PollingUnits = lazy(() => import('./pages/PollingUnits'));
const Administrators = lazy(() => import('./pages/Administrators'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const DataTransfer = lazy(() => import('./pages/DataTransfer'));
const Settings = lazy(() => import('./pages/Settings'));

const g = (perm, el) => <Guard perm={perm}>{el}</Guard>;

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Center minH="60vh"><Spinner color="brand.500" /></Center>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="people" element={g('people.view', <People />)} />
            <Route path="people/:id" element={g('people.view', <PersonProfile />)} />
            <Route path="wards" element={g('wards.view', <Wards />)} />
            <Route path="wards/:id" element={g('wards.view', <WardDetails />)} />
            <Route path="polling-units" element={g('pollingUnits.view', <PollingUnits />)} />
            <Route path="administrators" element={g('administrators.view', <Administrators />)} />
            <Route path="activity-logs" element={g('activityLogs.view', <ActivityLogs />)} />
            <Route path="data" element={g(['imports.view', 'exports.view'], <DataTransfer />)} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
