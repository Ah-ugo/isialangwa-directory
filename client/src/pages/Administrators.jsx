import { useState } from 'react';
import { Box, Button, Flex, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, Badge, useDisclosure } from '@chakra-ui/react';
import { Add, Edit2, Eye, Key, More, Profile2User, Lock1, Refresh2, UserRemove } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useNotify from '../hooks/useNotify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader, Panel, PersonAvatar, StatusBadge } from '../components/common/ui';
import AdminDrawer from '../components/administrators/AdminDrawer';
import TempPasswordModal from '../components/administrators/TempPasswordModal';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import { countPermissions, TOTAL_PERMISSIONS } from '../utils/permissions';
import { fmtDateTime } from '../utils/format';
import { T } from '../theme';

export default function Administrators() {
  const { isSuper, user } = useAuth();
  const notify = useNotify();
  const { data, loading, error, reload } = useFetch('/admins');
  const drawer = useDisclosure(), confirm = useDisclosure(), temp = useDisclosure();
  const [mode, setMode] = useState('create');
  const [sel, setSel] = useState(null);
  const [action, setAction] = useState(null); // 'deactivate' | 'reactivate' | 'reset'
  const [pw, setPw] = useState({ name: '', password: '' });
  const [busy, setBusy] = useState(false);

  const open = (m, a) => { setMode(m); setSel(a || null); drawer.onOpen(); };
  const ask = (a, act) => { setSel(a); setAction(act); confirm.onOpen(); };
  const run = async () => {
    setBusy(true);
    try {
      if (action === 'reset') { const r = await api.post(`/admins/${sel.id}/reset-password`); setPw({ name: sel.fullName, password: r.data.temporaryPassword }); temp.onOpen(); }
      else { await api.patch(`/admins/${sel.id}/status`, { status: action === 'deactivate' ? 'inactive' : 'active' }); notify.success(action === 'deactivate' ? 'Account deactivated' : 'Account reactivated'); }
      confirm.onClose(); reload();
    } catch (e) { confirm.onClose(); notify.error(e); } finally { setBusy(false); }
  };
  const created = (res) => { if (res?.temporaryPassword) { setPw({ name: res.data.fullName, password: res.temporaryPassword }); temp.onOpen(); } reload(); };

  const Actions = ({ a }) => {
    const protectedAcct = a.role === 'super_admin' || a.id === user.id;
    return (
      <Menu placement="bottom-end">
        <MenuButton as={IconButton} aria-label={`Actions for ${a.fullName}`} icon={<More size={18} />} variant="ghost" size="sm" />
        <MenuList>
          <MenuItem icon={<Eye size={17} />} onClick={() => open('view', a)}>View administrator</MenuItem>
          {isSuper && !protectedAcct && <>
            <MenuItem icon={<Edit2 size={17} />} onClick={() => open('account', a)}>Edit account</MenuItem>
            <MenuItem icon={<Lock1 size={17} />} onClick={() => open('permissions', a)}>Edit permissions</MenuItem>
            <MenuItem icon={<Key size={17} />} onClick={() => ask(a, 'reset')}>Reset password</MenuItem><MenuDivider />
            {a.status === 'active' ? <MenuItem icon={<UserRemove size={17} />} color={T.danger} onClick={() => ask(a, 'deactivate')}>Deactivate account</MenuItem> : <MenuItem icon={<Refresh2 size={17} />} onClick={() => ask(a, 'reactivate')}>Reactivate account</MenuItem>}
          </>}
        </MenuList>
      </Menu>
    );
  };
  const summary = (a) => (a.role === 'super_admin' ? 'Full access' : `${countPermissions(a.permissions)} of ${TOTAL_PERMISSIONS} permissions`);
  const create = isSuper && <Button leftIcon={<Add size={18} />} onClick={() => open('create')}>Add administrator</Button>;
  const copy = { deactivate: ['Deactivate this account?', 'They will be signed out immediately and cannot sign in until reactivated.', 'Deactivate'], reactivate: ['Reactivate this account?', 'They will be able to sign in again with their existing password.', 'Reactivate'], reset: ['Reset password?', 'A new temporary password will be generated and all their sessions will end.', 'Reset password'] }[action] || [];

  return (
    <>
      <PageHeader title="Administrators" subtitle="Control who can sign in and what each person can do" actions={create} />
      <Panel>
        {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingSkeleton />
          : !data?.length ? <EmptyState icon={<Profile2User size={24} />} title="No administrators" />
          : <>
            <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
              <Table><Thead><Tr><Th>Administrator</Th><Th>Role</Th><Th>Status</Th><Th>Permissions</Th><Th>Last active</Th><Th w="1%" /></Tr></Thead>
                <Tbody>{data.map((a) => (
                  <Tr key={a.id}>
                    <Td><Flex gap={3} align="center"><PersonAvatar name={a.fullName} /><Box><Text fontWeight={600}>{a.fullName}</Text><Text fontSize="12px" color={T.muted}>{a.email}</Text></Box></Flex></Td>
                    <Td>{a.role === 'super_admin' ? <Badge colorScheme="purple">Super Admin</Badge> : 'Administrator'}</Td>
                    <Td><StatusBadge status={a.status} /></Td><Td color="#4A5468">{summary(a)}</Td><Td color={T.muted}>{a.lastLogin ? fmtDateTime(a.lastLogin) : 'Never'}</Td><Td><Actions a={a} /></Td>
                  </Tr>))}</Tbody></Table>
            </Box>
            <Stack display={{ base: 'flex', md: 'none' }} p={3} spacing={2}>
              {data.map((a) => (
                <Panel key={a.id} p={3}><Flex justify="space-between" align="center" gap={2}>
                  <Flex gap={3} align="center" minW={0}><PersonAvatar name={a.fullName} size="md" /><Box minW={0}><Text fontWeight={600} noOfLines={1}>{a.fullName}</Text><Text fontSize="12px" color={T.muted} noOfLines={1}>{summary(a)}</Text><Box mt={1}><StatusBadge status={a.status} /></Box></Box></Flex>
                  <Actions a={a} /></Flex></Panel>))}
            </Stack>
          </>}
      </Panel>
      <AdminDrawer isOpen={drawer.isOpen} onClose={drawer.onClose} mode={mode} admin={sel} onSaved={(r) => (mode === 'create' ? created(r) : reload())} />
      <ConfirmDialog isOpen={confirm.isOpen} onClose={confirm.onClose} danger={action === 'deactivate'} title={copy[0]} body={copy[1]} confirmLabel={copy[2]} onConfirm={run} isLoading={busy} />
      <TempPasswordModal isOpen={temp.isOpen} onClose={temp.onClose} name={pw.name} password={pw.password} />
    </>
  );
}
