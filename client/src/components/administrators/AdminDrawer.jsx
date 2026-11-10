import { useEffect, useState } from 'react';
import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text, useBreakpointValue } from '@chakra-ui/react';
import api from '../../services/api';
import useNotify from '../../hooks/useNotify';
import PermissionEditor from '../permissions/PermissionEditor';
import { emptyPermissions } from '../../utils/permissions';
import { T } from '../../theme';

/** mode: 'create' | 'account' | 'permissions' | 'view' */
export default function AdminDrawer({ isOpen, onClose, mode, admin, onSaved }) {
  const notify = useNotify();
  const placement = useBreakpointValue({ base: 'bottom', md: 'right' });
  const [f, setF] = useState({ fullName: '', username: '', email: '', bankName: '', accountNumber: '', accountName: '' });
  const [perms, setPerms] = useState(emptyPermissions());
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErr({});
    setF({ fullName: admin?.fullName || '', username: admin?.username || '', email: admin?.email || '', bankName: admin?.bankName || '', accountNumber: admin?.accountNumber || '', accountName: admin?.accountName || '' });
    setPerms(admin ? { ...emptyPermissions(), ...admin.permissions } : emptyPermissions());
  }, [isOpen, admin, mode]);

  const showAccount = mode !== 'permissions';
  const showPerms = mode === 'create' || mode === 'permissions' || mode === 'view';
  const readOnly = mode === 'view';
  const title = { create: 'Add administrator', account: 'Edit account', permissions: 'Edit permissions', view: 'Administrator' }[mode];

  const submit = async () => {
    const x = {};
    if (showAccount && !readOnly) {
      if (f.fullName.trim().length < 2) x.fullName = 'Enter the full name';
      if (f.username.trim().length < 3) x.username = 'At least 3 characters';
      if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email address';
    }
    setErr(x);
    if (Object.keys(x).length) return;
    setSaving(true);
    try {
      let r;
      if (mode === 'create') r = await api.post('/admins', { ...f, permissions: perms });
      else if (mode === 'account') r = await api.put(`/admins/${admin.id}`, f);
      else r = await api.patch(`/admins/${admin.id}/permissions`, { permissions: perms });
      notify.success(mode === 'create' ? 'Administrator created' : mode === 'permissions' ? 'Permissions updated' : 'Account updated');
      onSaved?.(r.data);
      onClose();
    } catch (e) {
      e.response?.status === 409 ? setErr({ username: 'Username or email is already in use' }) : notify.error(e);
    } finally { setSaving(false); }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement={placement} size={placement === 'bottom' ? 'full' : 'md'}>
      <DrawerOverlay bg="blackAlpha.500" />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor={T.border}>{title}{admin && mode !== 'create' && <Text fontSize="13px" fontWeight={400} color={T.muted}>{admin.fullName}</Text>}</DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={5}>
            {showAccount && (
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={!!err.fullName}><FormLabel>Full name</FormLabel><Input isReadOnly={readOnly} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /><FormErrorMessage>{err.fullName}</FormErrorMessage></FormControl>
                <FormControl isRequired isInvalid={!!err.username}><FormLabel>Username</FormLabel><Input isReadOnly={readOnly} autoCapitalize="none" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /><FormErrorMessage>{err.username}</FormErrorMessage></FormControl>
                <FormControl isRequired isInvalid={!!err.email}><FormLabel>Email address</FormLabel><Input type="email" isReadOnly={readOnly} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><FormErrorMessage>{err.email}</FormErrorMessage></FormControl>
                <FormControl><FormLabel>Bank name</FormLabel><Input isReadOnly={readOnly} value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} /></FormControl>
                <FormControl><FormLabel>Account number</FormLabel><Input isReadOnly={readOnly} value={f.accountNumber} onChange={(e) => setF({ ...f, accountNumber: e.target.value })} /></FormControl>
                <FormControl><FormLabel>Account name</FormLabel><Input isReadOnly={readOnly} value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} /></FormControl>
                {mode === 'create' && <Text fontSize="13px" color={T.muted}>A temporary password is generated when you save. Share it securely — the administrator must change it at first sign-in.</Text>}
              </Stack>
            )}
            {showPerms && <Box><Text fontWeight={600} mb={3}>{admin?.role === 'super_admin' ? 'Permissions (Super Admin has full access)' : 'Permissions'}</Text><PermissionEditor value={perms} onChange={setPerms} isDisabled={readOnly} /></Box>}
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTop="1px solid" borderColor={T.border} gap={2}>
          <Button variant="outline" onClick={onClose} isDisabled={saving}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {!readOnly && <Button onClick={submit} isLoading={saving}>{mode === 'create' ? 'Create administrator' : 'Save changes'}</Button>}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
