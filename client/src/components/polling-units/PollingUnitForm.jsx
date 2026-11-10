import { useEffect, useMemo, useState } from 'react';
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Textarea } from '@chakra-ui/react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useNotify from '../../hooks/useNotify';
import SearchableSelect from '../common/SearchableSelect';

export default function PollingUnitForm({ isOpen, onClose, unit, defaultWardId, onSaved }) {
  const notify = useNotify();
  const wards = useFetch('/wards', {}, { enabled: isOpen });
  const [f, setF] = useState({ name: '', code: '', wardId: '', description: '' });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const opts = useMemo(() => (wards.data || []).map((w) => ({ value: w.id, label: w.name })), [wards.data]);
  useEffect(() => { if (isOpen) { setErr({}); setF({ name: unit?.name || '', code: unit?.code || '', wardId: unit?.wardId || defaultWardId || '', description: unit?.description || '' }); } }, [isOpen, unit, defaultWardId]);

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = 'Enter the polling unit name';
    if (!f.wardId) x.wardId = 'Select the parent ward';
    setErr(x);
    if (Object.keys(x).length) return;
    setSaving(true);
    try { const r = unit ? await api.put(`/polling-units/${unit.id}`, f) : await api.post('/polling-units', f); notify.success(unit ? 'Polling unit updated' : 'Polling unit created'); onSaved?.(r.data.data); onClose(); }
    catch (z) { z.response?.status === 409 ? setErr({ name: 'This name or code already exists in the ward' }) : notify.error(z); }
    finally { setSaving(false); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent as="form" onSubmit={submit} mx={4}>
        <ModalHeader>{unit ? 'Edit polling unit' : 'Add polling unit'}</ModalHeader><ModalCloseButton />
        <ModalBody><Stack spacing={4}>
          <FormControl isRequired isInvalid={!!err.wardId}><FormLabel>Parent ward</FormLabel><SearchableSelect options={opts} value={f.wardId} onChange={(v) => setF({ ...f, wardId: v })} isLoading={wards.loading} placeholder="Select ward" /><FormErrorMessage>{err.wardId}</FormErrorMessage></FormControl>
          <FormControl isRequired isInvalid={!!err.name}><FormLabel>Polling unit name</FormLabel><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><FormErrorMessage>{err.name}</FormErrorMessage></FormControl>
          <FormControl><FormLabel>Code (optional)</FormLabel><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></FormControl>
          <FormControl><FormLabel>Location description (optional)</FormLabel><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></FormControl>
        </Stack></ModalBody>
        <ModalFooter gap={2}><Button variant="outline" onClick={onClose} isDisabled={saving}>Cancel</Button><Button type="submit" isLoading={saving}>{unit ? 'Save changes' : 'Add polling unit'}</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
