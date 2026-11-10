import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Checkbox, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Input, Radio, RadioGroup, Stack, Text, Textarea, SimpleGrid, useBreakpointValue } from '@chakra-ui/react';
import api, { errMsg } from '../../services/api';
import useFetch from '../../hooks/useFetch';
import useNotify from '../../hooks/useNotify';
import { useAuth } from '../../context/AuthContext';
import SearchableSelect from '../common/SearchableSelect';
import { normalizePhone } from '../../utils/format';
import { T } from '../../theme';

const blank = (purpose, wardId = '') => ({ fullName: '', phone: '', address: '', bankName: '', accountNumber: '', accountName: '', wardId, pollingUnitId: '', preferredContact: '', notes: '', granted: false, purpose });

export default function PersonForm({ isOpen, onClose, person, onSaved, defaultWardId }) {
  const { can, settings } = useAuth();
  const notify = useNotify();
  const placement = useBreakpointValue({ base: 'bottom', md: 'right' });
  const editing = !!person;
  const [f, setF] = useState(blank(''));
  const [errors, setErrors] = useState({});
  const [dupes, setDupes] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPublicId, setPhotoPublicId] = useState('');
  const [photoDirty, setPhotoDirty] = useState(false);
  const [vcardFile, setVcardFile] = useState(null);
  const [vcardUrl, setVcardUrl] = useState('');
  const [vcardPublicId, setVcardPublicId] = useState('');
  const [vcardDirty, setVcardDirty] = useState(false);

  const showPhone = !editing || can('people.viewPhone');
  const showAddress = !editing || can('people.viewAddress');
  const showBankDetails = can('people.viewBankDetails');
  const showConsent = !editing || can('people.manageConsent');

  useEffect(() => {
    if (!isOpen) return;
    setErrors({}); setDupes(null);
    if (person) { setF({ fullName: person.fullName, phone: person.phone || '', address: person.address || '', bankName: person.bankName || '', accountNumber: person.accountNumber || '', accountName: person.accountName || '', wardId: person.wardId, pollingUnitId: person.pollingUnitId, preferredContact: person.preferredContact || '', notes: person.notes || '', granted: !!person.consent?.granted && !person.consent?.withdrawnAt, purpose: person.consent?.purpose || settings?.consentPurpose || '' }); setPhotoUrl(person.image || ''); setPhotoPublicId(person.imagePublicId || ''); setVcardUrl(person.voterCardImage || ''); setVcardPublicId(person.voterCardPublicId || ''); }
    else setF(blank(settings?.consentPurpose || '', defaultWardId || ''));
  }, [isOpen, person, settings, defaultWardId]);

  const wards = useFetch('/wards', {}, { enabled: isOpen });
  const units = useFetch('/polling-units', { wardId: f.wardId, all: true }, { enabled: isOpen && !!f.wardId });
  const wardOpts = useMemo(() => (wards.data || []).map((w) => ({ value: w.id, label: w.name })), [wards.data]);
  const unitOpts = useMemo(() => (units.data || []).map((u) => ({ value: u.id, label: u.name + (u.code ? ` · ${u.code}` : '') })), [units.data]);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const checkDupes = async () => {
    const n = normalizePhone(f.phone);
    if (!n || (editing && n === person.phone)) return setDupes(null);
    try { const r = await api.get('/people/check-duplicate', { params: { phone: n, excludeId: person?.id } }); setDupes(r.data.data.length ? r.data.data : null); } catch { /* optional */ }
  };

  const MAX_FILE = 5 * 1024 * 1024;

  const validate = () => {
    const e = {};
    if (f.fullName.trim().length < 2) e.fullName = 'Enter the full name';
    if (showPhone && !normalizePhone(f.phone)) e.phone = 'Enter a valid Nigerian number, e.g. 0803 123 4567';
    if (!f.wardId) e.wardId = 'Select a ward';
    if (!f.pollingUnitId) e.pollingUnitId = 'Select a polling unit';
    if (!editing && !f.granted) e.granted = 'Consent is required before saving';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const fileError = (file) => {
    if (!file || !file.type || !file.type.startsWith('image/')) return 'Only image files are allowed';
    if (file.size > MAX_FILE) return 'Image must be under 5 MB';
    return null;
  };

  const uploadFile = async (file) => {
    const form = new FormData();
    form.append('image', file);
    const r = await api.post('/people/upload-image', form);
    return r.data.data;
  };

  const setPhoto = (file) => {
    const err = fileError(file);
    if (err) { notify.error(err); return; }
    setPhotoFile(file);
    setPhotoDirty(true);
  };

  const setVcard = (file) => {
    const err = fileError(file);
    if (err) { notify.error(err); return; }
    setVcardFile(file);
    setVcardDirty(true);
  };

  const clearPhoto = () => { setPhotoFile(null); setPhotoUrl(''); setPhotoPublicId(''); setPhotoDirty(true); };
  const clearVcard = () => { setVcardFile(null); setVcardUrl(''); setVcardPublicId(''); setVcardDirty(true); };
  const submit = async (force = false) => {
    if (!validate()) return;
    setSaving(true);
    const body = { fullName: f.fullName.trim(), wardId: f.wardId, pollingUnitId: f.pollingUnitId, preferredContact: f.preferredContact, notes: f.notes, force };
    if (showPhone) body.phone = f.phone;
    if (showAddress) body.address = f.address;
    if (showBankDetails) {
      body.bankName = f.bankName;
      body.accountNumber = f.accountNumber;
      body.accountName = f.accountName;
    }
    if (showConsent) body.consent = { granted: f.granted, purpose: f.purpose, lawfulBasis: 'consent' };
    try {
      let nextPhotoUrl = photoUrl;
      let nextPhotoPublicId = photoPublicId;
      let nextVcardUrl = vcardUrl;
      let nextVcardPublicId = vcardPublicId;
      if (photoFile) {
        const uploaded = await uploadFile(photoFile);
        nextPhotoUrl = uploaded.url;
        nextPhotoPublicId = uploaded.publicId;
        setPhotoUrl(uploaded.url);
        setPhotoPublicId(uploaded.publicId);
        setPhotoDirty(true);
      }
      if (vcardFile) {
        const uploaded = await uploadFile(vcardFile);
        nextVcardUrl = uploaded.url;
        nextVcardPublicId = uploaded.publicId;
        setVcardUrl(uploaded.url);
        setVcardPublicId(uploaded.publicId);
        setVcardDirty(true);
      }
      if (photoDirty || photoFile) { body.image = nextPhotoUrl; body.imagePublicId = nextPhotoPublicId || undefined; }
      if (vcardDirty || vcardFile) { body.voterCardImage = nextVcardUrl; body.voterCardPublicId = nextVcardPublicId || undefined; }
      const r = editing ? await api.put(`/people/${person.id}`, body) : await api.post('/people', body);
      notify.success(editing ? 'Changes saved' : 'Person registered');
      onSaved?.(r.data.data);
      onClose();
    } catch (e) {
      if (e.response?.data?.code === 'DUPLICATE_PHONE') setDupes(e.response.data.duplicates);
      else notify.error(e);
    } finally { setSaving(false); }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement={placement} size={placement === 'bottom' ? 'full' : 'md'}>
      <DrawerOverlay bg="blackAlpha.500" />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottom="1px solid" borderColor={T.border} fontSize="18px">{editing ? 'Edit person' : 'Add person'}</DrawerHeader>
        <DrawerBody py={5}>
          <Stack spacing={5}>
            <Box>
              <Text fontWeight={600} mb={3}>Personal information</Text>
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={!!errors.fullName}><FormLabel>Full name</FormLabel><Input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="off" /><FormErrorMessage>{errors.fullName}</FormErrorMessage></FormControl>
                {showPhone && (
                  <FormControl isRequired isInvalid={!!errors.phone}>
                    <FormLabel>Phone number</FormLabel>
                    <Input type="tel" inputMode="tel" placeholder="0803 123 4567" value={f.phone} onChange={(e) => { set('phone', e.target.value); setDupes(null); }} onBlur={checkDupes} autoComplete="off" />
                    {!errors.phone && <FormHelperText>Saved in international format, e.g. +234 803 123 4567.</FormHelperText>}
                    <FormErrorMessage>{errors.phone}</FormErrorMessage>
                  </FormControl>
                )}
                {dupes && (
                  <Alert status="warning" borderRadius="10px" alignItems="flex-start">
                    <AlertIcon mt={1} />
                    <Box>
                      <AlertTitle fontSize="14px">This number is already in the directory</AlertTitle>
                      <AlertDescription fontSize="13px">{dupes.map((d) => `${d.fullName} (${d.ward || '—'}, ${d.pollingUnit || '—'})`).join('; ')}. Shared household numbers are allowed — review, then save if this is a different person.</AlertDescription>
                    </Box>
                  </Alert>
                )}
                {showAddress && <FormControl><FormLabel>Address <Text as="span" color={T.muted}>(optional)</Text></FormLabel><Input value={f.address} onChange={(e) => set('address', e.target.value)} /></FormControl>}
                {showBankDetails && (
                  <>
                    <Divider />
                    <Text fontWeight={600}>Bank details</Text>
                    <FormControl><FormLabel>Bank name</FormLabel><Input value={f.bankName} onChange={(e) => set('bankName', e.target.value)} autoComplete="off" /></FormControl>
                    <FormControl><FormLabel>Account number</FormLabel><Input inputMode="numeric" autoComplete="off" value={f.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} /></FormControl>
                    <FormControl><FormLabel>Name on account</FormLabel><Input value={f.accountName} onChange={(e) => set('accountName', e.target.value)} autoComplete="off" /></FormControl>
                  </>
                )}
              </Stack>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight={600} mb={3}>Location</Text>
              <SimpleGrid columns={1} spacing={4}>
                <FormControl isRequired isInvalid={!!errors.wardId}>
                  <FormLabel htmlFor="ward">Ward</FormLabel>
                  <SearchableSelect id="ward" options={wardOpts} value={f.wardId} isLoading={wards.loading} placeholder="Select ward" onChange={(v) => { setF((s) => ({ ...s, wardId: v, pollingUnitId: '' })); setErrors((e) => ({ ...e, wardId: undefined })); }} />
                  <FormErrorMessage>{errors.wardId}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.pollingUnitId}>
                  <FormLabel htmlFor="pu">Polling unit</FormLabel>
                  <SearchableSelect id="pu" options={unitOpts} value={f.pollingUnitId} isDisabled={!f.wardId} isLoading={units.loading} placeholder={f.wardId ? 'Select polling unit' : 'Select a ward first'} onChange={(v) => set('pollingUnitId', v)} />
                  <FormErrorMessage>{errors.pollingUnitId}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>
            <Divider />
            <Box>
              <Text fontWeight={600} mb={3}>Contact preferences</Text>
              <FormControl><FormLabel>Preferred contact method</FormLabel>
                <RadioGroup value={f.preferredContact || 'none'} onChange={(v) => set('preferredContact', v === 'none' ? '' : v)}>
                  <Stack direction="row" spacing={5}><Radio value="call">Call</Radio><Radio value="whatsapp">WhatsApp</Radio><Radio value="none">No preference</Radio></Stack>
                </RadioGroup>
              </FormControl>
              {showConsent && (
                <Box mt={4} p={4} bg="#F7F8FC" borderRadius="12px" border="1px solid" borderColor={errors.granted ? T.danger : T.border}>
                  <FormControl isInvalid={!!errors.granted}>
                    <Checkbox isChecked={f.granted} onChange={(e) => set('granted', e.target.checked)} alignItems="flex-start" sx={{ '.chakra-checkbox__label': { fontSize: '13.5px', lineHeight: 1.5 } }}>
                      This person has voluntarily agreed to be kept in this contact directory and understands they can withdraw consent or ask for deletion at any time.
                    </Checkbox>
                    <FormErrorMessage>{errors.granted}</FormErrorMessage>
                  </FormControl>
                  <FormControl mt={3}><FormLabel>Purpose of processing</FormLabel><Input size="sm" value={f.purpose} onChange={(e) => set('purpose', e.target.value)} /></FormControl>
                </Box>
              )}
            </Box>
            <Divider />
            <Box>
              <Text fontWeight={600} mb={3}>Identity documents</Text>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Voter’s card <Text as="span" color={T.muted}>(optional)</Text></FormLabel>
                  <input type="file" accept="image/*" onChange={(e) => setVcard(e.target.files?.[0])} disabled={saving} style={{ width: '100%', fontSize: '13px', color: '#4A5468' }} />
                  {vcardFile && <Text color={T.muted} fontSize="13px" mt={1}>{vcardFile.name}</Text>}
                  {vcardUrl && (
                    <Box mt={2}>
                      <img src={vcardUrl} alt="Voter’s card" style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: 8, border: '1px solid #E9ECF3', objectFit: 'contain', display: 'block' }} />
                      <HStack mt={2} spacing={2}>
                        <Button size="sm" variant="ghost" onClick={() => window.open(vcardUrl, '_blank')}>View</Button>
                        <Button size="sm" variant="ghost" color={T.danger} onClick={clearVcard} isDisabled={saving}>Remove</Button>
                      </HStack>
                    </Box>
                  )}
                  <FormHelperText>Voter’s card image, stored securely.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Person’s photograph <Text as="span" color={T.muted}>(optional)</Text></FormLabel>
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} disabled={saving} style={{ width: '100%', fontSize: '13px', color: '#4A5468' }} />
                  {photoFile && <Text color={T.muted} fontSize="13px" mt={1}>{photoFile.name}</Text>}
                  {photoUrl && (
                    <Box mt={2}>
                      <img src={photoUrl} alt="Portrait" style={{ width: '140px', height: '140px', borderRadius: '12px', border: '1px solid #E9ECF3', objectFit: 'cover', display: 'block' }} />
                      <HStack mt={2} spacing={2}>
                        <Button size="sm" variant="ghost" onClick={() => window.open(photoUrl, '_blank')}>View</Button>
                        <Button size="sm" variant="ghost" color={T.danger} onClick={clearPhoto} isDisabled={saving}>Remove</Button>
                      </HStack>
                    </Box>
                  )}
                  <FormHelperText>Portrait photograph of the person, stored securely.</FormHelperText>
                </FormControl>
              </Stack>
            </Box>
            <FormControl><FormLabel>Notes <Text as="span" color={T.muted}>(optional)</Text></FormLabel><Textarea rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Keep notes factual and necessary." /><FormErrorMessage>{errors.notes}</FormErrorMessage></FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTop="1px solid" borderColor={T.border} gap={2}>
          <Button variant="outline" onClick={onClose} isDisabled={saving}>Cancel</Button>
          <Button onClick={() => submit(!!dupes)} isLoading={saving} loadingText="Saving">{dupes ? 'Save anyway' : editing ? 'Save changes' : 'Save person'}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
