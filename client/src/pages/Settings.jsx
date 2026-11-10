import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, AlertIcon, Box, Button, FormControl, FormHelperText, FormLabel, Input, NumberInput, NumberInputField, Select, SimpleGrid, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, Textarea } from '@chakra-ui/react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useNotify from '../hooks/useNotify';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Panel } from '../components/common/ui';
import { T } from '../theme';

function Account() {
  const { user, setUser, logout, settings } = useAuth();
  const notify = useNotify();
  const [p, setP] = useState({
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    bankName: user.bankName || '',
    accountNumber: user.accountNumber || '',
    accountName: user.accountName || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');
  const act = async (key, fn, ok) => { setBusy(key); try { await fn(); notify.success(ok); } catch (e) { notify.error(e); } finally { setBusy(''); } };
  return (
    <Stack spacing={8} maxW="560px">
      <Stack spacing={4}>
        <Text fontWeight={600} fontSize="16px">Profile</Text>
        <FormControl><FormLabel>Full name</FormLabel><Input value={p.fullName} onChange={(e) => setP({ ...p, fullName: e.target.value })} /></FormControl>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}><FormControl><FormLabel>Username</FormLabel><Input value={p.username} onChange={(e) => setP({ ...p, username: e.target.value })} /></FormControl><FormControl><FormLabel>Email</FormLabel><Input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></FormControl></SimpleGrid>
        <Text fontWeight={600} fontSize="14px">Bank details</Text>
        <FormControl><FormLabel>Bank name</FormLabel><Input value={p.bankName} onChange={(e) => setP({ ...p, bankName: e.target.value })} /></FormControl>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl><FormLabel>Account number</FormLabel><Input inputMode="numeric" autoComplete="off" value={p.accountNumber} onChange={(e) => setP({ ...p, accountNumber: e.target.value })} /></FormControl>
          <FormControl><FormLabel>Name on account</FormLabel><Input value={p.accountName} onChange={(e) => setP({ ...p, accountName: e.target.value })} /></FormControl>
        </SimpleGrid>
        <Box><Button isLoading={busy === 'p'} onClick={() => act('p', async () => { const r = await api.put('/auth/profile', p); setUser(r.data.data); }, 'Profile updated')}>Save profile</Button></Box>
      </Stack>
      <Stack spacing={4}>
        <Text fontWeight={600} fontSize="16px">Change password</Text>
        <FormControl><FormLabel>Current password</FormLabel><Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></FormControl>
        <FormControl><FormLabel>New password</FormLabel><Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /><FormHelperText>At least {settings?.passwordMinLength || 10} characters, with letters and numbers.</FormHelperText></FormControl>
        <Box><Button isLoading={busy === 'w'} isDisabled={!pw.currentPassword || !pw.newPassword} onClick={() => act('w', async () => { const r = await api.put('/auth/change-password', pw); setUser(r.data.data); setPw({ currentPassword: '', newPassword: '' }); }, 'Password updated')}>Update password</Button></Box>
      </Stack>
      <Stack spacing={3}>
        <Text fontWeight={600} fontSize="16px">Sessions</Text>
        <Text color={T.muted}>Signed in as {user.role === 'super_admin' ? 'Super Admin' : 'Administrator'}. If you used a shared device, sign out everywhere else.</Text>
        <Box><Button variant="outline" isLoading={busy === 's'} onClick={() => act('s', () => api.post('/auth/logout-all'), 'Other sessions signed out')}>Sign out other devices</Button> <Button variant="ghost" ml={2} onClick={logout}>Sign out</Button></Box>
      </Stack>
    </Stack>
  );
}

function Admin() {
  const { can, setSettings } = useAuth();
  const notify = useNotify();
  const canEdit = can('settings.edit');
  const { data } = useFetch('/settings');
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return <Text color={T.muted}>Loading…</Text>;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const num = (k, min, max) => <NumberInput min={min} max={max} value={s[k]} isDisabled={!canEdit} onChange={(_, v) => set(k, Number.isNaN(v) ? min : v)}><NumberInputField /></NumberInput>;
  const save = async () => {
    setBusy(true);
    try {
      const { appName, organisationLabel, defaultPageSize, dateFormat, sessionExpiryHours, passwordMinLength, retentionMonths, consentPurpose, privacyNotice } = s;
      const r = await api.put('/settings', { appName, organisationLabel, defaultPageSize, dateFormat, sessionExpiryHours, passwordMinLength, retentionMonths, consentPurpose, privacyNotice });
      setSettings({ ...r.data.data }); notify.success('Settings saved');
    } catch (e) { notify.error(e); } finally { setBusy(false); }
  };
  return (
    <Stack spacing={8} maxW="640px">
      {!canEdit && <Alert status="info" borderRadius="10px"><AlertIcon />You can view these settings but not change them.</Alert>}
      <Stack spacing={4}><Text fontWeight={600} fontSize="16px">Application</Text>
        <FormControl><FormLabel>Application name</FormLabel><Input value={s.appName} isDisabled={!canEdit} onChange={(e) => set('appName', e.target.value)} /></FormControl>
        <FormControl><FormLabel>Organisation label</FormLabel><Input value={s.organisationLabel} isDisabled={!canEdit} onChange={(e) => set('organisationLabel', e.target.value)} /></FormControl>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          <FormControl><FormLabel>Rows per page</FormLabel>{num('defaultPageSize', 10, 100)}</FormControl>
          <FormControl><FormLabel>Calling code</FormLabel><Input value={s.defaultCountryCode} isReadOnly /></FormControl>
          <FormControl><FormLabel>Date display</FormLabel><Select value={s.dateFormat} isDisabled={!canEdit} onChange={(e) => set('dateFormat', e.target.value)}><option value="short">9 Nov 2026</option><option value="numeric">09/11/2026</option></Select></FormControl>
        </SimpleGrid>
      </Stack>
      <Stack spacing={4}><Text fontWeight={600} fontSize="16px">Security</Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
          <FormControl><FormLabel>Session expiry (hours)</FormLabel>{num('sessionExpiryHours', 1, 72)}<FormHelperText>Applies to new sign-ins.</FormHelperText></FormControl>
          <FormControl><FormLabel>Minimum password length</FormLabel>{num('passwordMinLength', 8, 64)}</FormControl>
        </SimpleGrid>
        <Text fontSize="13px" color={T.muted}>Login protection: sign-in attempts are rate-limited, and an account is locked for 15 minutes after 5 wrong passwords.</Text>
      </Stack>
      <Stack spacing={4}><Text fontWeight={600} fontSize="16px">Data management & privacy</Text>
        <FormControl><FormLabel>Retention period (months)</FormLabel>{num('retentionMonths', 1, 120)}<FormHelperText>Review and remove records you no longer need after this period.</FormHelperText></FormControl>
        <FormControl><FormLabel>Default purpose of processing</FormLabel><Input value={s.consentPurpose} isDisabled={!canEdit} onChange={(e) => set('consentPurpose', e.target.value)} /></FormControl>
        <FormControl><FormLabel>Privacy notice</FormLabel><Textarea rows={7} value={s.privacyNotice} isDisabled={!canEdit} onChange={(e) => set('privacyNotice', e.target.value)} /><FormHelperText>Share this with every person before collecting their details.</FormHelperText></FormControl>
        {can(['imports.view', 'exports.view']) && <Box><Button as={RouterLink} to="/data" variant="outline">CSV backup: import & export</Button></Box>}
        <Text fontSize="13px" color={T.muted}>Database backups are managed in MongoDB Atlas (Cloud Backup / snapshots). Enable them for your cluster and test a restore.</Text>
      </Stack>
      {canEdit && <Box><Button onClick={save} isLoading={busy}>Save settings</Button></Box>}
    </Stack>
  );
}

export default function Settings() {
  const { can } = useAuth();
  const showAdmin = can('settings.view');
  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and the application" />
      <Panel p={{ base: 4, md: 6 }}>
        <Tabs isLazy>
          <TabList><Tab>Account</Tab>{showAdmin && <Tab>Application & privacy</Tab>}</TabList>
          <TabPanels><TabPanel px={0} pt={6}><Account /></TabPanel>{showAdmin && <TabPanel px={0} pt={6}><Admin /></TabPanel>}</TabPanels>
        </Tabs>
      </Panel>
    </>
  );
}
