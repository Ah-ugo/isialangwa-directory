import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertIcon, Box, Button, Divider, Flex, Grid, HStack, IconButton, Menu, MenuButton, MenuItem, MenuList, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, SimpleGrid, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { Call, Edit2, Message, More, Trash, DocumentText, TickCircle, CloseCircle } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import useNotify from '../hooks/useNotify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Chip, ErrorState, PageHeader, PersonAvatar, Panel, StatusBadge } from '../components/common/ui';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import PersonForm from '../components/people/PersonForm';
import { fmtDate, fmtDateTime, prettyPhone, telLink, waLink } from '../utils/format';
import { T } from '../theme';

const Row = ({ label, children }) => (
  <Box><Text color={T.muted} fontSize="12px" mb={0.5}>{label}</Text><Text fontWeight={500} whiteSpace="pre-wrap">{children || '—'}</Text></Box>
);

export default function PersonProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { can } = useAuth();
  const notify = useNotify();
  const { data: p, loading, error, reload } = useFetch(`/people/${id}`);
  const edit = useDisclosure();
  const del = useDisclosure();
  const wd = useDisclosure();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const run = async (fn, ok, close) => {
    setBusy(true);
    try { await fn(); notify.success(ok); close?.(); } catch (e) { notify.error(e); } finally { setBusy(false); }
  };

  if (error) return <><PageHeader title="Person" back="/people" /><Panel><ErrorState message={error} onRetry={reload} /></Panel></>;
  if (!p) return <Skeleton h="320px" borderRadius="16px" />;

  const canContact = p.phone && p.contactable && can('people.viewPhone');
  const hasMenu = can('people.delete') || can('activityLogs.view') || can('people.manageConsent');

  return (
    <>
      <PageHeader title={p.fullName} back="/people" />
      <Grid templateColumns={{ base: '1fr', lg: '1fr 320px' }} gap={5} alignItems="start">
        <Panel p={{ base: 4, md: 6 }}>
          <Flex gap={4} align="center" wrap="wrap">
            {p.image ? (
              <Box flex="0 0 auto"><img src={p.image} alt={p.fullName} style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', border: `1px solid ${T.border}` }} /></Box>
            ) : (
              <PersonAvatar name={p.fullName} size="xl" />
            )}
            <Box flex={1} minW="200px">
              <Text fontSize="20px" fontWeight={700} letterSpacing="-0.01em">{p.fullName}</Text>
              {p.phone && <Text color={T.muted}>{prettyPhone(p.phone)}</Text>}
              <HStack mt={2} spacing={2}><Chip>{p.ward?.name}</Chip><Chip>{p.pollingUnit?.name}</Chip></HStack>
            </Box>
          </Flex>

          {!p.contactable && <Alert status="warning" borderRadius="10px" mt={5}><AlertIcon />Consent has been withdrawn. Call and WhatsApp actions are disabled for this contact.</Alert>}

          <Flex gap={2} mt={5} wrap="wrap">
            {can('people.contact') && <Button as={canContact ? 'a' : 'button'} href={canContact ? telLink(p.phone) : undefined} leftIcon={<Call size={18} />} isDisabled={!canContact} flex={{ base: 1, sm: 'none' }}>Call</Button>}
            {can('people.whatsapp') && <Button as={canContact ? 'a' : 'button'} href={canContact ? waLink(p.phone) : undefined} target="_blank" rel="noopener noreferrer" variant="whatsapp" leftIcon={<Message size={18} />} isDisabled={!canContact} flex={{ base: 1, sm: 'none' }}>WhatsApp</Button>}
            {can('people.edit') && <Button variant="outline" leftIcon={<Edit2 size={18} />} onClick={edit.onOpen} flex={{ base: 1, sm: 'none' }}>Edit</Button>}
            {hasMenu && (
              <Menu placement="bottom-end">
                <MenuButton as={IconButton} aria-label="More actions" icon={<More size={20} />} variant="outline" />
                <MenuList>
                  {can('activityLogs.view') && <MenuItem icon={<DocumentText size={18} />} as={RouterLink} to={`/activity-logs?resourceId=${p.id}`}>View activity history</MenuItem>}
                  {can('people.manageConsent') && (p.contactable
                    ? <MenuItem icon={<CloseCircle size={18} />} onClick={wd.onOpen}>Record consent withdrawal</MenuItem>
                    : <MenuItem icon={<TickCircle size={18} />} onClick={() => run(async () => { await api.patch(`/people/${p.id}/consent`, { granted: true }); reload(); }, 'Consent recorded')}>Record consent again</MenuItem>)}
                  {can('people.delete') && <MenuItem icon={<Trash size={18} />} color={T.danger} onClick={del.onOpen}>Delete contact</MenuItem>}
                </MenuList>
              </Menu>
            )}
          </Flex>
          <Divider my={6} />
          <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={5}>
            <Row label="Ward">{p.ward?.name}</Row>
            <Row label="Polling unit">{p.pollingUnit?.name}{p.pollingUnit?.code ? ` · ${p.pollingUnit.code}` : ''}</Row>
            {'phone' in p && <Row label="Phone number">{prettyPhone(p.phone)}</Row>}
            <Row label="Preferred contact">{p.preferredContact === 'call' ? 'Call' : p.preferredContact === 'whatsapp' ? 'WhatsApp' : ''}</Row>
            {'address' in p && <Row label="Address">{p.address}</Row>}
            <Row label="Registered">{fmtDate(p.createdAt)}</Row>
          </Grid>
          {(can('people.viewImage') || can('people.viewVoterCard')) && (
            <>
              <Divider my={6} />
              <Text fontWeight={600} mb={4}>Photograph & voter’s card</Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {can('people.viewImage') && 'image' in p && (
                  <Box>
                    <Text color={T.muted} fontSize="12px" mb={2}>Photograph</Text>
                    {p.image ? (
                      <Box
                        as="button"
                        type="button"
                        aria-label={`View ${p.fullName}'s photograph`}
                        onClick={() => setPreview({ title: 'Photograph', src: p.image, alt: `${p.fullName} photograph` })}
                        w="full"
                        h="220px"
                        p={2}
                        bg="gray.50"
                        border="1px solid"
                        borderColor={T.border}
                        borderRadius="12px"
                        cursor="zoom-in"
                      >
                        <Box as="img" src={p.image} alt={`${p.fullName} photograph`} w="full" h="full" objectFit="contain" loading="lazy" />
                      </Box>
                    ) : <Text color={T.muted} fontSize="13px">No photograph uploaded.</Text>}
                  </Box>
                )}
                {can('people.viewVoterCard') && 'voterCardImage' in p && (
                  <Box>
                    <Text color={T.muted} fontSize="12px" mb={2}>Voter’s card</Text>
                    {p.voterCardImage ? (
                      <Box
                        as="button"
                        type="button"
                        aria-label={`View ${p.fullName}'s voter card`}
                        onClick={() => setPreview({ title: 'Voter’s card', src: p.voterCardImage, alt: `${p.fullName} voter card` })}
                        w="full"
                        h="220px"
                        p={2}
                        bg="gray.50"
                        border="1px solid"
                        borderColor={T.border}
                        borderRadius="12px"
                        cursor="zoom-in"
                      >
                        <Box as="img" src={p.voterCardImage} alt={`${p.fullName} voter card`} w="full" h="full" objectFit="contain" loading="lazy" />
                      </Box>
                    ) : <Text color={T.muted} fontSize="13px">No voter’s card uploaded.</Text>}
                  </Box>
                )}
              </SimpleGrid>
            </>
          )}
          {p.notes && <><Divider my={6} /><Row label="Notes">{p.notes}</Row></>}
        </Panel>

        {p.consent && (
          <Panel p={5}>
            <Flex justify="space-between" align="center" mb={4}><Text fontWeight={600}>Consent</Text><StatusBadge status={p.contactable ? 'granted' : 'withdrawn'} /></Flex>
            <Stack spacing={4}>
              <Row label="Purpose">{p.consent.purpose}</Row>
              <Row label="Lawful basis">{p.consent.lawfulBasis === 'other' ? 'Other (documented)' : 'Consent'}</Row>
              <Row label="Recorded">{fmtDateTime(p.consent.recordedAt)}</Row>
              {p.consent.withdrawnAt && <Row label="Withdrawn">{fmtDateTime(p.consent.withdrawnAt)}</Row>}
            </Stack>
          </Panel>
        )}
      </Grid>

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>{preview?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {preview && <Box as="img" src={preview.src} alt={preview.alt} display="block" maxW="full" maxH="75vh" mx="auto" objectFit="contain" />}
          </ModalBody>
        </ModalContent>
      </Modal>
      <PersonForm isOpen={edit.isOpen} onClose={edit.onClose} person={p} onSaved={reload} />
      <ConfirmDialog isOpen={del.isOpen} onClose={del.onClose} danger title="Delete this contact?" body={`${p.fullName} will be permanently removed from the directory. This can’t be undone.`} confirmLabel="Delete contact" isLoading={busy}
        onConfirm={() => run(async () => { await api.delete(`/people/${p.id}`); nav('/people', { replace: true }); }, 'Contact deleted', del.onClose)} />
      <ConfirmDialog isOpen={wd.isOpen} onClose={wd.onClose} title="Record consent withdrawal?" body="Call and WhatsApp actions will be disabled for this contact. You can delete the record from the menu if they asked for deletion." confirmLabel="Record withdrawal" isLoading={busy}
        onConfirm={() => run(async () => { await api.patch(`/people/${p.id}/consent`, { granted: false }); reload(); }, 'Consent withdrawal recorded', wd.onClose)} />
    </>
  );
}
