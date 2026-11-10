import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Flex, Input, Select, SimpleGrid, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { DocumentText } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Panel } from '../components/common/ui';
import { fmtDateTime } from '../utils/format';
import { T } from '../theme';

const GROUPS = [['', 'All activity'], ['person.created', 'Person registered'], ['person.updated', 'Person updated'], ['person.deleted', 'Person deleted'], ['consent.withdrawn', 'Consent withdrawn'], ['ward.created', 'Ward created'], ['ward.updated', 'Ward edited'], ['polling_unit.created', 'Polling unit created'], ['admin.created', 'Administrator created'], ['admin.deactivated', 'Administrator deactivated'], ['admin.permissions_updated', 'Permissions updated'], ['csv.imported', 'CSV imported'], ['csv.exported', 'CSV exported'], ['auth.login', 'Sign-ins']];
const tone = (a) => (/deleted|deactivated|withdrawn/.test(a) ? 'red' : /created|imported|reactivated/.test(a) ? 'green' : /exported|permissions|password/.test(a) ? 'orange' : 'blue');

export default function ActivityLogs() {
  const { settings } = useAuth();
  const [sp, setSp] = useSearchParams();
  const resourceId = sp.get('resourceId') || '';
  const [action, setAction] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [page, setPage] = useState(1);
  useEffect(() => setPage(1), [action, from, to, resourceId]);
  const { data, meta, loading, error, reload } = useFetch('/activity-logs', { action, from, to, resourceId, page, limit: settings?.defaultPageSize || 25 });

  return (
    <>
      <PageHeader title="Activity logs" subtitle="A permanent record of important actions. Entries can’t be edited or deleted." />
      <Panel>
        <Stack p={4} spacing={3} borderBottom="1px solid" borderColor={T.border}>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={2}>
            <Select aria-label="Activity type" value={action} onChange={(e) => setAction(e.target.value)}>{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
            <Input aria-label="From date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input aria-label="To date" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </SimpleGrid>
          {resourceId && <Flex align="center" gap={2}><Text fontSize="13px" color={T.muted}>Showing history for one record.</Text><Button size="xs" variant="soft" onClick={() => setSp({}, { replace: true })}>Show all</Button></Flex>}
        </Stack>
        {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingSkeleton />
          : !data?.length ? <EmptyState icon={<DocumentText size={24} />} title="No activity found" text="Try a different filter." />
          : <>
            <Box display={{ base: 'none', md: 'block' }} overflowX="auto"><Table><Thead><Tr><Th>When</Th><Th>Administrator</Th><Th>Action</Th><Th>Details</Th></Tr></Thead>
              <Tbody>{data.map((l) => <Tr key={l.id}><Td whiteSpace="nowrap" color={T.muted}>{fmtDateTime(l.timestamp)}</Td><Td>{l.admin?.fullName || '—'}</Td><Td><Badge colorScheme={tone(l.action)}>{l.action.replace(/[._]/g, ' ')}</Badge></Td><Td>{l.description}</Td></Tr>)}</Tbody></Table></Box>
            <Stack display={{ base: 'flex', md: 'none' }} p={3} spacing={2}>{data.map((l) => <Panel key={l.id} p={3}><Badge colorScheme={tone(l.action)}>{l.action.replace(/[._]/g, ' ')}</Badge><Text mt={1.5}>{l.description}</Text><Text fontSize="12px" color={T.muted} mt={1}>{l.admin?.fullName || '—'} · {fmtDateTime(l.timestamp)}</Text></Panel>)}</Stack>
            <Pagination meta={meta} onPage={setPage} />
          </>}
      </Panel>
    </>
  );
}
