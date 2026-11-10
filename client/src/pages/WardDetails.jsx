import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Button, Flex, Grid, Skeleton, Text, useDisclosure, Box } from '@chakra-ui/react';
import { Add, Edit2, Location, People, DocumentText } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useNotify from '../hooks/useNotify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Chip, EmptyState, ErrorState, PageHeader, Panel, SearchInput } from '../components/common/ui';
import WardForm from '../components/wards/WardForm';
import PollingUnitForm from '../components/polling-units/PollingUnitForm';
import BulkPollingUnitModal from '../components/polling-units/BulkPollingUnitModal';
import ReassignModal from '../components/polling-units/ReassignModal';
import PollingUnitList from '../components/polling-units/PollingUnitList';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import { fmtDate } from '../utils/format';
import { T } from '../theme';

export default function WardDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const notify = useNotify();
  const { data: ward, error, reload } = useFetch(`/wards/${id}`);
  const [q, setQ] = useState('');
  const wardForm = useDisclosure(), unitForm = useDisclosure(), bulk = useDisclosure(), reassign = useDisclosure(), del = useDisclosure();
  const [edit, setEdit] = useState(null), [target, setTarget] = useState(null), [busy, setBusy] = useState(false);
  const units = useMemo(() => (ward?.pollingUnits || []).filter((u) => !q || u.name.toLowerCase().includes(q.toLowerCase()) || (u.code || '').toLowerCase().includes(q.toLowerCase())).map((u) => ({ ...u, ward: { id: ward.id, name: ward.name } })), [ward, q]);

  if (error) return <><PageHeader title="Ward" back="/wards" /><Panel><ErrorState message={error} onRetry={reload} /></Panel></>;
  if (!ward) return <Skeleton h="300px" borderRadius="16px" />;

  const removeUnit = async () => {
    setBusy(true);
    try { await api.delete(`/polling-units/${target.id}`); notify.success('Polling unit deleted'); del.onClose(); reload(); }
    catch (e) { del.onClose(); notify.error(e, 'Couldn’t delete polling unit'); } finally { setBusy(false); }
  };
  const add = can('pollingUnits.create') && (
    <><Button variant="outline" onClick={bulk.onOpen} display={{ base: 'none', sm: 'inline-flex' }}>Add several</Button><Button leftIcon={<Add size={18} />} onClick={() => { setEdit(null); unitForm.onOpen(); }}>Add polling unit</Button></>
  );

  return (
    <>
      <PageHeader title={ward.name} subtitle={ward.code ? `Ward code ${ward.code}` : 'Ward details'} back="/wards" actions={can('wards.edit') && <Button variant="outline" leftIcon={<Edit2 size={18} />} onClick={wardForm.onOpen}>Edit ward</Button>} />
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={5}>
        <Panel p={4}><Text color={T.muted} fontSize="13px">Polling units</Text><Text fontSize="24px" fontWeight={700}>{ward.pollingUnitCount}</Text></Panel>
        <Panel p={4}><Text color={T.muted} fontSize="13px">Contacts</Text><Flex align="center" justify="space-between"><Text fontSize="24px" fontWeight={700}>{ward.peopleCount}</Text>{can('people.view') && <Button as={RouterLink} to={`/people?wardId=${ward.id}`} size="sm" variant="soft" leftIcon={<People size={16} />}>View people</Button>}</Flex></Panel>
        <Panel p={4}><Text color={T.muted} fontSize="13px">Created</Text><Text fontSize="16px" fontWeight={600} mt={1.5}>{fmtDate(ward.createdAt)}</Text></Panel>
      </Grid>
      {ward.description && <Panel p={4} mb={5}><Text color="#4A5468">{ward.description}</Text></Panel>}
      <Panel>
        <Flex p={4} gap={2} direction={{ base: 'column', sm: 'row' }} justify="space-between" borderBottom="1px solid" borderColor={T.border}>
          <SearchInput value={q} onChange={setQ} placeholder="Search polling units in this ward" maxW={{ sm: '340px' }} />
          <Flex gap={2}>{add}</Flex>
        </Flex>
        {!ward.pollingUnits.length ? <EmptyState icon={<Location size={24} />} title="No polling units yet" text="Add polling units to this ward. Each ward can have as many as it needs." action={add} />
          : !units.length ? <EmptyState title="No polling units match your search" />
          : <PollingUnitList units={units} showWard={false} onEdit={(u) => { setEdit(u); unitForm.onOpen(); }} onDelete={(u) => { setTarget(u); del.onOpen(); }} onReassign={(u) => { setTarget(u); reassign.onOpen(); }} />}
      </Panel>
      <WardForm isOpen={wardForm.isOpen} onClose={wardForm.onClose} ward={ward} onSaved={reload} />
      <PollingUnitForm isOpen={unitForm.isOpen} onClose={unitForm.onClose} unit={edit} defaultWardId={ward.id} onSaved={reload} />
      <BulkPollingUnitModal isOpen={bulk.isOpen} onClose={bulk.onClose} defaultWardId={ward.id} onDone={reload} />
      <ReassignModal isOpen={reassign.isOpen} onClose={reassign.onClose} unit={target} onDone={reload} />
      <ConfirmDialog isOpen={del.isOpen} onClose={del.onClose} danger title={`Delete ${target?.name}?`} body={target?.peopleCount ? `It still has ${target.peopleCount} contact(s). Move them to another polling unit first.` : 'This polling unit will be permanently removed.'} confirmLabel="Delete" onConfirm={removeUnit} isLoading={busy} />
    </>
  );
}
