import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Flex, Select, useDisclosure } from '@chakra-ui/react';
import { Add, Location } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useNotify from '../hooks/useNotify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Panel, SearchInput } from '../components/common/ui';
import PollingUnitList from '../components/polling-units/PollingUnitList';
import PollingUnitForm from '../components/polling-units/PollingUnitForm';
import BulkPollingUnitModal from '../components/polling-units/BulkPollingUnitModal';
import ReassignModal from '../components/polling-units/ReassignModal';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

export default function PollingUnits() {
  const { can, settings } = useAuth();
  const notify = useNotify();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [wardId, setWardId] = useState(sp.get('wardId') || '');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  useEffect(() => setPage(1), [dq, wardId]);
  const wards = useFetch('/wards');
  const { data, meta, loading, error, reload } = useFetch('/polling-units', { q: dq, wardId, page, limit: settings?.defaultPageSize || 20 });
  const form = useDisclosure(), bulk = useDisclosure(), reassign = useDisclosure(), del = useDisclosure();
  const [edit, setEdit] = useState(null), [target, setTarget] = useState(null), [busy, setBusy] = useState(false);
  useEffect(() => { if (sp.get('new') === '1' && can('pollingUnits.create')) { form.onOpen(); setSp({}, { replace: true }); } /* eslint-disable-next-line */ }, []);

  const confirmDelete = async () => {
    setBusy(true);
    try { await api.delete(`/polling-units/${target.id}`); notify.success('Polling unit deleted'); del.onClose(); reload(); }
    catch (e) { del.onClose(); notify.error(e, 'Couldn’t delete polling unit'); } finally { setBusy(false); }
  };
  const add = can('pollingUnits.create') && (<><Button variant="outline" onClick={bulk.onOpen} display={{ base: 'none', sm: 'inline-flex' }}>Add several</Button><Button leftIcon={<Add size={18} />} onClick={() => { setEdit(null); form.onOpen(); }}>Add polling unit</Button></>);
  const filtered = dq || wardId;

  return (
    <>
      <PageHeader title="Polling units" subtitle="Every polling unit, grouped under its ward" actions={add} />
      <Panel>
        <Flex p={4} gap={2} direction={{ base: 'column', sm: 'row' }} borderBottom="1px solid" borderColor="#E9ECF3">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name or code" maxW={{ sm: '340px' }} />
          <Select aria-label="Filter by ward" value={wardId} onChange={(e) => setWardId(e.target.value)} maxW={{ sm: '240px' }}><option value="">All wards</option>{(wards.data || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
        </Flex>
        {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingSkeleton />
          : !data?.length ? <EmptyState icon={<Location size={24} />} title={filtered ? 'No polling units match' : 'No polling units yet'} text={filtered ? 'Try another search or ward.' : 'Create a ward first, then add its polling units.'} action={!filtered && add} />
          : <><PollingUnitList units={data} onEdit={(u) => { setEdit(u); form.onOpen(); }} onDelete={(u) => { setTarget(u); del.onOpen(); }} onReassign={(u) => { setTarget(u); reassign.onOpen(); }} /><Pagination meta={meta} onPage={setPage} /></>}
      </Panel>
      <PollingUnitForm isOpen={form.isOpen} onClose={form.onClose} unit={edit} defaultWardId={wardId} onSaved={reload} />
      <BulkPollingUnitModal isOpen={bulk.isOpen} onClose={bulk.onClose} defaultWardId={wardId} onDone={reload} />
      <ReassignModal isOpen={reassign.isOpen} onClose={reassign.onClose} unit={target} onDone={reload} />
      <ConfirmDialog isOpen={del.isOpen} onClose={del.onClose} danger title={`Delete ${target?.name}?`} body={target?.peopleCount ? `It still has ${target.peopleCount} contact(s). Move them to another polling unit first.` : 'This polling unit will be permanently removed.'} confirmLabel="Delete" onConfirm={confirmDelete} isLoading={busy} />
    </>
  );
}
