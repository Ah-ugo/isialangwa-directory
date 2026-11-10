import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Flex, Input, Select, SimpleGrid, Stack, useDisclosure } from '@chakra-ui/react';
import { UserAdd, People as PeopleIcon } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Panel, SearchInput } from '../components/common/ui';
import PersonTable from '../components/people/PersonTable';
import PersonCard from '../components/people/PersonCard';
import PersonForm from '../components/people/PersonForm';

export default function People() {
  const { can, settings } = useAuth();
  const [sp, setSp] = useSearchParams();
  const form = useDisclosure();
  const f = { q: sp.get('q') || '', wardId: sp.get('wardId') || '', pollingUnitId: sp.get('pollingUnitId') || '', preferredContact: sp.get('preferredContact') || '', from: sp.get('from') || '', to: sp.get('to') || '', sort: sp.get('sort') || '-createdAt', page: Number(sp.get('page')) || 1 };
  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setSp(n, { replace: true });
  };

  const [qInput, setQInput] = useState(f.q);
  const dq = useDebounce(qInput, 300);
  useEffect(() => { if (dq !== f.q) set({ q: dq }); /* eslint-disable-next-line */ }, [dq]);
  useEffect(() => { if (sp.get('new') === '1') { form.onOpen(); const n = new URLSearchParams(sp); n.delete('new'); setSp(n, { replace: true }); } /* eslint-disable-next-line */ }, []);

  const wards = useFetch('/wards');
  const units = useFetch('/polling-units', { wardId: f.wardId, all: true }, { enabled: !!f.wardId });
  const { data, meta, loading, error, reload } = useFetch('/people', { ...f, limit: settings?.defaultPageSize || 20 });
  const filtersActive = f.q || f.wardId || f.pollingUnitId || f.preferredContact || f.from || f.to;
  const addBtn = can('people.create') && <Button leftIcon={<UserAdd size={18} />} onClick={form.onOpen}>Add person</Button>;

  return (
    <>
      <PageHeader title="People" subtitle="Everyone in the directory, by ward and polling unit" actions={addBtn} />
      <Panel>
        <Stack p={4} spacing={3} borderBottom="1px solid" borderColor="#E9ECF3">
          <SearchInput value={qInput} onChange={setQInput} placeholder={can('people.viewPhone') ? 'Search by name or phone number' : 'Search by name'} />
          <SimpleGrid columns={{ base: 2, md: 3, xl: 6 }} spacing={2}>
            <Select aria-label="Ward" value={f.wardId} onChange={(e) => set({ wardId: e.target.value, pollingUnitId: '' })}><option value="">All wards</option>{(wards.data || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
            <Select aria-label="Polling unit" value={f.pollingUnitId} isDisabled={!f.wardId} onChange={(e) => set({ pollingUnitId: e.target.value })}><option value="">{f.wardId ? 'All polling units' : 'Select ward first'}</option>{(units.data || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
            <Select aria-label="Preferred contact" value={f.preferredContact} onChange={(e) => set({ preferredContact: e.target.value })}><option value="">Any contact method</option><option value="call">Call</option><option value="whatsapp">WhatsApp</option></Select>
            <Select aria-label="Sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}><option value="-createdAt">Newest first</option><option value="createdAt">Oldest first</option><option value="fullName">Name A–Z</option><option value="-fullName">Name Z–A</option></Select>
            <Input aria-label="Registered from" type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} />
            <Input aria-label="Registered to" type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} />
          </SimpleGrid>
          {filtersActive && <Box><Button size="sm" variant="ghost" onClick={() => { setQInput(''); setSp({}, { replace: true }); }}>Clear filters</Button></Box>}
        </Stack>

        {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <LoadingSkeleton /> : data?.length === 0 ? (
          <EmptyState icon={<PeopleIcon size={24} />} title={filtersActive ? 'No one matches these filters' : 'No people yet'} text={filtersActive ? 'Try a different name or clear the filters.' : 'Add the first person to start building the directory.'} action={!filtersActive && addBtn} />
        ) : (
          <Box opacity={loading ? 0.6 : 1} transition="opacity .15s">
            <Box display={{ base: 'none', md: 'block' }}><PersonTable people={data || []} /></Box>
            <Stack display={{ base: 'flex', md: 'none' }} p={3} spacing={2}>{(data || []).map((p) => <PersonCard key={p.id} person={p} />)}</Stack>
            <Pagination meta={meta} onPage={(p) => set({ page: String(p) }) || window.scrollTo(0, 0)} />
          </Box>
        )}
      </Panel>
      <PersonForm isOpen={form.isOpen} onClose={form.onClose} onSaved={reload} defaultWardId={f.wardId} />
    </>
  );
}
