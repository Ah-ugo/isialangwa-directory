import { useToast } from '@chakra-ui/react';
import { useMemo } from 'react';
import { errMsg } from '../services/api';

export default function useNotify() {
  const toast = useToast({ position: 'top-right', duration: 3500, isClosable: true, variant: 'subtle' });
  return useMemo(() => ({
    success: (title, description) => toast({ title, description, status: 'success' }),
    error: (e, title = 'Something went wrong') => toast({ title, description: typeof e === 'string' ? e : errMsg(e), status: 'error', duration: 5000 }),
    info: (title, description) => toast({ title, description, status: 'info' }),
  }), [toast]);
}
