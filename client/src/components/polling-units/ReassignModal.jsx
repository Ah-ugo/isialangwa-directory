import { useEffect, useMemo, useState } from 'react';
import { Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text } from '@chakra-ui/react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useNotify from '../../hooks/useNotify';
import SearchableSelect from '../common/SearchableSelect';

/** Moves every contact out of a polling unit so it can be deleted. */
export default function ReassignModal({ isOpen, onClose, unit, onDone }) {
  const notify = useNotify();
  const wards = useFetch('/wards', {}, { enabled: isOpen });
  const [wardId, setWardId] = useState('');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const units = useFetch('/polling-units', { wardId, all: true }, { enabled: isOpen && !!wardId });
  useEffect(() => { if (isOpen) { setWardId(unit?.wardId || ''); setTarget(''); } }, [isOpen, unit]);
  const wOpts = useMemo(() => (wards.data || []).map((w) => ({ value: w.id, label: w.name })), [wards.data]);
  const uOpts = useMemo(() => (units.data || []).filter((u) => u.id !== unit?.id).map((u) => ({ value: u.id, label: u.name })), [units.data, unit]);
  const go = async () => {
    setBusy(true);
    try { const r = await api.post(`/polling-units/${unit.id}/reassign`, { targetPollingUnitId: target }); notify.success(r.data.message); onDone?.(); onClose(); } catch (e) { notify.error(e); } finally { setBusy(false); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent mx={4}>
        <ModalHeader>Move contacts</ModalHeader><ModalCloseButton />
        <ModalBody><Stack spacing={4}>
          <Text color="#4A5468">Move the {unit?.peopleCount} contact(s) in <b>{unit?.name}</b> to another polling unit. You can then delete it.</Text>
          <FormControl><FormLabel>Ward</FormLabel><SearchableSelect options={wOpts} value={wardId} onChange={(v) => { setWardId(v); setTarget(''); }} placeholder="Select ward" /></FormControl>
          <FormControl><FormLabel>Move to polling unit</FormLabel><SearchableSelect options={uOpts} value={target} onChange={setTarget} isDisabled={!wardId} isLoading={units.loading} placeholder="Select polling unit" /></FormControl>
        </Stack></ModalBody>
        <ModalFooter gap={2}><Button variant="outline" onClick={onClose} isDisabled={busy}>Cancel</Button><Button onClick={go} isLoading={busy} isDisabled={!target}>Move contacts</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
