import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { PersonAvatar, Chip, Panel } from '../common/ui';
import ContactActions from './ContactActions';
import { fmtDate, prettyPhone } from '../../utils/format';
import { T } from '../../theme';

export default function PersonCard({ person }) {
  const nav = useNavigate();
  return (
    <Panel p={3} cursor="pointer" onClick={() => nav(`/people/${person.id}`)} _active={{ bg: '#F7F8FC' }} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && nav(`/people/${person.id}`)}>
      <Flex align="center" gap={3}>
        {person.image ? (
          <Box flex="0 0 auto"><img src={person.image} alt={person.fullName} style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.border}` }} /></Box>
        ) : (
          <PersonAvatar name={person.fullName} size="md" />
        )}
        <Box flex={1} minW={0}>
          <Text fontWeight={600} noOfLines={1}>{person.fullName}</Text>
          {person.phone && <Text color={T.muted} fontSize="13px">{prettyPhone(person.phone)}</Text>}
          <HStack mt={1.5} spacing={1.5} flexWrap="wrap"><Chip>{person.ward?.name}</Chip><Chip>{person.pollingUnit?.name}</Chip></HStack>
        </Box>
        <ContactActions person={person} size="md" />
      </Flex>
      <Text color={T.muted} fontSize="12px" mt={2}>Added {fmtDate(person.createdAt)}</Text>
    </Panel>
  );
}
