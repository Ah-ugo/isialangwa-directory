import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertIcon, Box, Button, FormControl, FormHelperText, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr } from '@chakra-ui/react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useNotify from '../../hooks/useNotify';
import SearchableSelect from '../common/SearchableSelect';
import { StatusBadge } from '../common/ui';

// One per line: "Name" or "Name, Code"
const parse = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [name, ...rest] = l.split(','); return { name: name.trim(), code: rest.join(',').trim() }; });

export default function BulkPollingUnitModal({ isOpen, onClose, defaultWardId, onDone }) {
  const notify = useNotify();
  const wards = useFetch('/wards', {}, { enabled: isOpen });
  const [wardId, setWardId] = useState('');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const opts = useMemo(() => (wards.data || []).map((w) => ({ value: w.id, label: w.name })), [wards.data]);
  useEffect(() => { if (isOpen) { setWardId(defaultWardId || ''); setText(''); setPreview(null); } }, [isOpen, defaultWardId]);
  useEffect(() => { setPreview(null); }, [text, wardId]);
  const items = parse(text);

  const call = async (dryRun) => {
    setBusy(true);
    try {
      const r = await api.post('/polling-units/bulk', { wardId, items, dryRun });
      if (dryRun) setPreview(r.data.data);
      else { notify.success(`${r.data.data.created} polling units created`, r.data.data.skipped ? `${r.data.data.skipped} duplicates skipped` : undefined); onDone?.(); onClose(); }
    } catch (e) { notify.error(e); } finally { setBusy(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent mx={4}>
        <ModalHeader>Add several polling units</ModalHeader><ModalCloseButton />
        <ModalBody><Stack spacing={4}>
          <FormControl isRequired><FormLabel>Ward</FormLabel><SearchableSelect options={opts} value={wardId} onChange={setWardId} placeholder="Select ward" isLoading={wards.loading} /></FormControl>
          <FormControl><FormLabel>Polling units</FormLabel>
            <Textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Polling Unit 001\nPolling Unit 002, PU-002\nPolling Unit 003'} fontFamily="mono" fontSize="13px" />
            <FormHelperText>One per line. Add a code after a comma if you have one. {items.length > 0 && `${items.length} entered.`}</FormHelperText></FormControl>
          {preview && (
            <Box>
              <Alert status={preview.duplicateCount ? 'warning' : 'success'} borderRadius="10px" mb={3}><AlertIcon />{preview.validCount} will be created{preview.duplicateCount ? `, ${preview.duplicateCount} duplicate(s) will be skipped` : ''}.</Alert>
              <Box maxH="240px" overflowY="auto" border="1px solid #E9ECF3" borderRadius="12px">
                <Table size="sm"><Thead position="sticky" top={0} bg="white"><Tr><Th>Name</Th><Th>Code</Th><Th>Status</Th></Tr></Thead>
                  <Tbody>{preview.rows.map((r) => <Tr key={r.line}><Td>{r.name}</Td><Td>{r.code || '—'}</Td><Td><StatusBadge status={r.status} label={r.status === 'valid' ? 'New' : 'Duplicate'} />{r.messages[0] && <Text fontSize="11px" color="#788197">{r.messages[0]}</Text>}</Td></Tr>)}</Tbody></Table>
              </Box>
            </Box>
          )}
        </Stack></ModalBody>
        <ModalFooter gap={2}>
          <Button variant="outline" onClick={onClose} isDisabled={busy}>Cancel</Button>
          {!preview ? <Button onClick={() => call(true)} isLoading={busy} isDisabled={!wardId || !items.length}>Preview</Button>
            : <Button onClick={() => call(false)} isLoading={busy} isDisabled={!preview.validCount}>Create {preview.validCount}</Button>}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
