import { useEffect, useState } from 'react';
import { Button, FormControl, FormErrorMessage, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Textarea } from '@chakra-ui/react';
import api from '../../services/api';
import useNotify from '../../hooks/useNotify';

export default function WardForm({ isOpen, onClose, ward, onSaved }) {
  const notify = useNotify();
  const [f, setF] = useState({ name: '', code: '', description: '' });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) { setErr(''); setF({ name: ward?.name || '', code: ward?.code || '', description: ward?.description || '' }); } }, [isOpen, ward]);
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Enter the ward name');
    setSaving(true);
    try { const r = ward ? await api.put(`/wards/${ward.id}`, f) : await api.post('/wards', f); notify.success(ward ? 'Ward updated' : 'Ward created'); onSaved?.(r.data.data); onClose(); }
    catch (x) { x.response?.status === 409 ? setErr('A ward with this name or code already exists') : notify.error(x); }
    finally { setSaving(false); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent as="form" onSubmit={submit} mx={4}>
        <ModalHeader>{ward ? 'Edit ward' : 'Create ward'}</ModalHeader><ModalCloseButton />
        <ModalBody><Stack spacing={4}>
          <FormControl isRequired isInvalid={!!err}><FormLabel>Ward name</FormLabel><Input autoFocus value={f.name} onChange={(e) => { setErr(''); setF({ ...f, name: e.target.value }); }} /><FormErrorMessage>{err}</FormErrorMessage></FormControl>
          <FormControl><FormLabel>Ward code (optional)</FormLabel><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></FormControl>
          <FormControl><FormLabel>Description (optional)</FormLabel><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></FormControl>
        </Stack></ModalBody>
        <ModalFooter gap={2}><Button variant="outline" onClick={onClose} isDisabled={saving}>Cancel</Button><Button type="submit" isLoading={saving}>{ward ? 'Save changes' : 'Create ward'}</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
