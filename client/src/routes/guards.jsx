import { Navigate, useLocation } from 'react-router-dom';
import { Center, Spinner, Text, Flex } from '@chakra-ui/react';
import { Lock1 } from 'iconsax-react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import { EmptyState, Panel } from '../components/common/ui';

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Center minH="100vh"><Spinner color="brand.500" /></Center>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <AppLayout />;
}

export function Guard({ perm, children }) {
  const { can } = useAuth();
  if (can(perm)) return children;
  return <Panel><EmptyState icon={<Lock1 size={24} />} title="You don’t have access to this page" text="Ask the Super Admin if you need it." /></Panel>;
}
