import { Box, Flex, Table, Tbody, Td, Text, Th, Thead, Tr, Badge } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { PersonAvatar } from '../common/ui';
import ContactActions from './ContactActions';
import { fmtDate, prettyPhone } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../theme';

export default function PersonTable({ people }) {
  const nav = useNavigate();
  const { can } = useAuth();
  const showPhone = can('people.viewPhone');
  return (
    <Box overflowX="auto">
      <Table size="md">
        <Thead><Tr><Th>Person</Th>{showPhone && <Th>Phone</Th>}<Th>Ward</Th><Th>Polling unit</Th><Th>Added</Th><Th textAlign="right">Actions</Th></Tr></Thead>
        <Tbody>
          {people.map((p) => (
            <Tr key={p.id} cursor="pointer" _hover={{ bg: '#FAFBFE' }} onClick={() => nav(`/people/${p.id}`)}>
              <Td><Flex align="center" gap={3}>
                {p.image ? (
                  <Box flex="0 0 auto"><img src={p.image} alt={p.fullName} style={{ width: 32, height: 32, borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.border}` }} /></Box>
                ) : (
                  <PersonAvatar name={p.fullName} />
                )}
                <Box><Text fontWeight={600} as="a" href={`/people/${p.id}`} onClick={(e) => { e.preventDefault(); nav(`/people/${p.id}`); }}>{p.fullName}</Text>{!p.contactable && <Badge colorScheme="orange" ml={2}>Consent withdrawn</Badge>}</Box></Flex></Td>
              {showPhone && <Td color="#4A5468">{prettyPhone(p.phone)}</Td>}
              <Td>{p.ward?.name}</Td>
              <Td>{p.pollingUnit?.name}</Td>
              <Td color={T.muted}>{fmtDate(p.createdAt)}</Td>
              <Td><Flex justify="flex-end"><ContactActions person={p} /></Flex></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
