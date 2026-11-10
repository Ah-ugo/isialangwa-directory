import { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Alert, AlertDescription, AlertIcon, Box, Button, Checkbox, Flex, FormControl, FormLabel, Input, SimpleGrid, Stack, Tab, TabList, TabPanel, TabPanels, Table, Tabs, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { DocumentDownload, DocumentUpload } from 'iconsax-react';
import api, { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch';
import useNotify from '../hooks/useNotify';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Panel, StatusBadge } from '../components/common/ui';
import SearchableSelect from '../components/common/SearchableSelect';
import { downloadBlob } from '../utils/format';
import { T } from '../theme';

const COLUMNS = ['Full Name', 'Phone Number', 'Ward', 'Polling Unit', 'Address', 'Preferred Contact', 'Consent Status'];

function ImportPanel() {
  const notify = useNotify();
  const fileRef = useRef();
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [incDup, setIncDup] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setRows(null); setPreview(null); setResult(null); setFileName(''); setIncDup(false); if (fileRef.current) fileRef.current.value = ''; };
  const onFile = (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return notify.error('Please upload a file smaller than 4 MB.', 'File too large');
    setResult(null); setPreview(null); setFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true, transformHeader: (h) => h.trim(),
      complete: async (r) => {
        const missing = ['Full Name', 'Phone Number', 'Ward', 'Polling Unit'].filter((c) => !r.meta.fields?.some((f) => f.toLowerCase() === c.toLowerCase()));
        if (missing.length) return notify.error(`Missing column(s): ${missing.join(', ')}`, 'Check the file headers');
        setRows(r.data); setBusy(true);
        try { const res = await api.post('/import/preview', { rows: r.data }); setPreview(res.data.data); } catch (e) { notify.error(e); setRows(null); } finally { setBusy(false); }
      },
      error: () => notify.error('We couldn’t read that file. Save it as CSV and try again.'),
    });
  };
  const commit = async () => {
    setBusy(true);
    try { const r = await api.post('/import/commit', { rows, includeDuplicates: incDup }); setResult(r.data.data); setPreview(null); setRows(null); notify.success(`${r.data.data.imported} contacts imported`); } catch (e) { notify.error(e); } finally { setBusy(false); }
  };
  const template = () => downloadBlob(new Blob([COLUMNS.join(',') + '\r\n'], { type: 'text/csv' }), 'contacts-template.csv');
  const s = preview?.summary;

  return (
    <Stack spacing={5}>
      <Text color="#4A5468">Upload a CSV with these columns: <b>{COLUMNS.join(', ')}</b>. Ward and polling unit must already exist. Every row needs consent recorded as “Granted”. Nothing is imported until you confirm.</Text>
      <Flex gap={2} wrap="wrap">
        <Button as="label" htmlFor="csv" cursor="pointer" leftIcon={<DocumentUpload size={18} />} isLoading={busy && !preview}>Choose CSV file<input ref={fileRef} id="csv" type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} /></Button>
        <Button variant="outline" onClick={template}>Download template</Button>
        {fileName && <Button variant="ghost" onClick={reset}>Start over</Button>}
      </Flex>
      {fileName && <Text fontSize="13px" color={T.muted}>{fileName}</Text>}
      {result && (
        <Alert status="success" borderRadius="12px" alignItems="flex-start"><AlertIcon /><AlertDescription>Imported <b>{result.imported}</b> of {result.total} rows. Skipped {result.skipped}: {result.errors} with errors, {result.duplicates} possible duplicates{incDup ? ' (included)' : ''}.</AlertDescription></Alert>
      )}
      {preview && (
        <Stack spacing={4}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            {[['Rows', s.total], ['Ready', s.valid], ['Possible duplicates', s.duplicates], ['Errors', s.errors]].map(([l, v]) => <Panel key={l} p={3}><Text fontSize="12px" color={T.muted}>{l}</Text><Text fontSize="22px" fontWeight={700}>{v}</Text></Panel>)}
          </SimpleGrid>
          <Box maxH="360px" overflow="auto" border="1px solid" borderColor={T.border} borderRadius="12px">
            <Table size="sm"><Thead position="sticky" top={0} bg="white" zIndex={1}><Tr><Th>Row</Th><Th>Name</Th><Th>Ward</Th><Th>Polling unit</Th><Th>Status</Th></Tr></Thead>
              <Tbody>{preview.rows.map((r) => <Tr key={r.row}><Td>{r.row}</Td><Td>{r.data.fullName}</Td><Td>{r.data.wardName}</Td><Td>{r.data.pollingUnitName}</Td><Td><StatusBadge status={r.status} />{r.messages.map((m) => <Text key={m} fontSize="11px" color={T.muted}>{m}</Text>)}</Td></Tr>)}</Tbody></Table>
          </Box>
          {preview.truncated && <Text fontSize="12px" color={T.muted}>Showing the first 300 rows, problems first. All rows are checked again when you confirm.</Text>}
          {s.duplicates > 0 && <Checkbox isChecked={incDup} onChange={(e) => setIncDup(e.target.checked)}>Also import the {s.duplicates} possible duplicate(s) (shared numbers)</Checkbox>}
          {s.errors > 0 && <Alert status="warning" borderRadius="10px"><AlertIcon />Rows with errors are never imported. Fix them in your file and re-upload, or continue without them.</Alert>}
          <Flex><Button onClick={commit} isLoading={busy} isDisabled={!s.valid && !(incDup && s.duplicates)}>Import {s.valid + (incDup ? s.duplicates : 0)} contacts</Button></Flex>
        </Stack>
      )}
    </Stack>
  );
}

function ExportPanel() {
  const notify = useNotify();
  const [wardId, setWardId] = useState(''), [unitId, setUnitId] = useState(''), [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const wards = useFetch('/wards');
  const units = useFetch('/polling-units', { wardId, all: true }, { enabled: !!wardId });
  const wOpts = useMemo(() => [{ value: '', label: 'All wards' }, ...(wards.data || []).map((w) => ({ value: w.id, label: w.name }))], [wards.data]);
  const uOpts = useMemo(() => [{ value: '', label: 'All polling units' }, ...(units.data || []).map((u) => ({ value: u.id, label: u.name }))], [units.data]);
  const go = async () => {
    setBusy(true);
    try {
      const r = await api.get('/export/people', { params: { wardId: wardId || undefined, pollingUnitId: unitId || undefined, q: q || undefined }, responseType: 'blob' });
      downloadBlob(r.data, `contacts-${new Date().toISOString().slice(0, 10)}.csv`);
      notify.success('Export ready', 'The export has been recorded in the activity log.');
    } catch (e) {
      let msg = errMsg(e);
      if (e.response?.data instanceof Blob) { try { msg = JSON.parse(await e.response.data.text()).message; } catch { /* keep */ } }
      notify.error(msg);
    } finally { setBusy(false); }
  };
  return (
    <Stack spacing={4} maxW="520px">
      <Text color="#4A5468">Export contacts you’re authorised to see. Columns such as phone, address and consent only appear if your account can view them. Every export is logged.</Text>
      <FormControl><FormLabel>Ward</FormLabel><SearchableSelect options={wOpts} value={wardId} onChange={(v) => { setWardId(v); setUnitId(''); }} placeholder="All wards" /></FormControl>
      <FormControl><FormLabel>Polling unit</FormLabel><SearchableSelect options={uOpts} value={unitId} onChange={setUnitId} isDisabled={!wardId} placeholder="All polling units" /></FormControl>
      <FormControl><FormLabel>Name contains (optional)</FormLabel><Input value={q} onChange={(e) => setQ(e.target.value)} /></FormControl>
      <Flex><Button leftIcon={<DocumentDownload size={18} />} onClick={go} isLoading={busy}>Export CSV</Button></Flex>
    </Stack>
  );
}

export default function DataTransfer() {
  const { can } = useAuth();
  const tabs = [can('imports.view') && 'import', can('exports.view') && 'export'].filter(Boolean);
  return (
    <>
      <PageHeader title="Import & export" subtitle="Move contact records in and out of the directory in a controlled way" />
      <Panel p={{ base: 4, md: 6 }}>
        <Tabs isLazy variant="line">
          <TabList>{tabs.includes('import') && <Tab>Import CSV</Tab>}{tabs.includes('export') && <Tab>Export CSV</Tab>}</TabList>
          <TabPanels>
            {tabs.includes('import') && <TabPanel px={0} pt={5}>{can('imports.execute') ? <ImportPanel /> : <Text color={T.muted}>You can view this page but don’t have permission to run imports.</Text>}</TabPanel>}
            {tabs.includes('export') && <TabPanel px={0} pt={5}>{can('exports.execute') ? <ExportPanel /> : <Text color={T.muted}>You can view this page but don’t have permission to run exports.</Text>}</TabPanel>}
          </TabPanels>
        </Tabs>
      </Panel>
    </>
  );
}
