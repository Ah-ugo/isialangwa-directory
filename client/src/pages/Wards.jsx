import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Flex, Select, SimpleGrid, Skeleton, useDisclosure } from '@chakra-ui/react';
import { Add, Map } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import useNotify from '../hooks/useNotify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, PageHeader, Panel, SearchInput } from '../components/common/ui';
import WardCard from '../components/wards/WardCard';
import WardForm from '../components/wards/WardForm';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

export default function Wards() {
  const { can } = useAuth();
  const notify = useNotify();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('name');
  const dq = useDebounce(q, 300);
  const { data, loading, error, reload } = useFetch('/wards', { q: dq, sort });
  const form = useDisclosure();
  const del = useDisclosure();
  const [edit, setEdit] = useState(null);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (sp.get('new') === '1' && can('wards.create')) { form.onOpen(); setSp({}, { replace: true }); } /* eslint-disable-next-line */ }, []);
  const open = (w) => { setEdit(w || null); form.onOpen(); };
  const create = can('wards.create') && <Button leftIcon={<Add size={18} />} onClick={() => open()}>Create ward</Button>;
  const confirmDelete = async () => {
    setBusy(true);
    try { await api.delete(`/wards/${target.id}`); notify.success('Ward deleted'); del.onClose(); reload(); } catch (e) { notify.error(e, 'Couldn’t delete ward'); del.onClose(); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Wards" subtitle="Organise the local government area into wards" actions={create} />
      <Flex gap={2} mb={4} direction={{ base: 'column', sm: 'row' }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search wards by name or code" maxW={{ sm: '380px' }} />
        <Select aria-label="Sort wards" value={sort} onChange={(e) => setSort(e.target.value)} maxW={{ sm: '200px' }}><option value="name">Name A–Z</option><option value="createdAt">Newest first</option><option value="units">Most polling units</option><option value="people">Most people</option></Select>
      </Flex>
      {error && !data ? <Panel><ErrorState message={error} onRetry={reload} /></Panel>
        : loading && !data ? <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>{[1, 2, 3].map((i) => <Skeleton key={i} h="150px" borderRadius="16px" />)}</SimpleGrid>
        : !data?.length ? <Panel><EmptyState icon={<Map size={24} />} title={dq ? 'No wards match your search' : 'No wards yet'} text={dq ? 'Try another name or code.' : 'Create a ward, then add its polling units.'} action={!dq && create} /></Panel>
        : <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>{data.map((w) => <WardCard key={w.id} ward={w} onEdit={open} onDelete={(x) => { setTarget(x); del.onOpen(); }} />)}</SimpleGrid>}
      <WardForm isOpen={form.isOpen} onClose={form.onClose} ward={edit} onSaved={reload} />
      <ConfirmDialog isOpen={del.isOpen} onClose={del.onClose} danger title={`Delete ${target?.name}?`} body="Only empty wards can be deleted. If it still has polling units or people, move them first." confirmLabel="Delete ward" onConfirm={confirmDelete} isLoading={busy} />
    </>
  );
}
