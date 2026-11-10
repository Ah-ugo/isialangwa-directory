import { Box, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Stack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import { Edit2, More, People, Trash, Location } from 'iconsax-react';
import { Link as RouterLink } from 'react-router-dom';
import { Chip, Panel } from '../common/ui';
import { fmtDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../theme';

function Actions({ u, onEdit, onDelete, onReassign }) {
  const { can } = useAuth();
  if (!(can('pollingUnits.edit') || can('pollingUnits.delete') || can('people.view'))) return null;
  return (
    <Menu placement="bottom-end">
      <MenuButton as={IconButton} aria-label={`Actions for ${u.name}`} icon={<More size={18} />} variant="ghost" size="sm" />
      <MenuList>
        {can('people.view') && <MenuItem icon={<People size={17} />} as={RouterLink} to={`/people?wardId=${u.wardId}&pollingUnitId=${u.id}`}>View people</MenuItem>}
        {can('pollingUnits.edit') && <MenuItem icon={<Edit2 size={17} />} onClick={() => onEdit(u)}>Edit</MenuItem>}
        {can('pollingUnits.edit') && can('people.edit') && u.peopleCount > 0 && <MenuItem icon={<People size={17} />} onClick={() => onReassign(u)}>Move contacts…</MenuItem>}
        {can('pollingUnits.delete') && <MenuItem icon={<Trash size={17} />} color={T.danger} onClick={() => onDelete(u)}>Delete</MenuItem>}
      </MenuList>
    </Menu>
  );
}

export default function PollingUnitList({ units, showWard = true, ...actions }) {
  return (
    <>
      <Box display={{ base: 'none', md: 'block' }} overflowX="auto">
        <Table><Thead><Tr><Th>Polling unit</Th><Th>Code</Th>{showWard && <Th>Ward</Th>}<Th isNumeric>Contacts</Th><Th>Created</Th><Th w="1%" /></Tr></Thead>
          <Tbody>{units.map((u) => (
            <Tr key={u.id}><Td fontWeight={600}>{u.name}</Td><Td color={T.muted}>{u.code || '—'}</Td>{showWard && <Td>{u.ward?.name}</Td>}<Td isNumeric>{u.peopleCount}</Td><Td color={T.muted}>{fmtDate(u.createdAt)}</Td><Td><Actions u={u} {...actions} /></Td></Tr>))}
          </Tbody></Table>
      </Box>
      <Stack display={{ base: 'flex', md: 'none' }} p={3} spacing={2}>
        {units.map((u) => (
          <Panel key={u.id} p={3}>
            <Flex justify="space-between" align="center" gap={2}>
              <Flex gap={3} align="center" minW={0}><Flex w="36px" h="36px" borderRadius="10px" bg={T.primaryLight} color={T.primary} align="center" justify="center" flexShrink={0}><Location size={18} /></Flex>
                <Box minW={0}><Text fontWeight={600} noOfLines={1}>{u.name}</Text><Text fontSize="12px" color={T.muted}>{[u.code, showWard && u.ward?.name].filter(Boolean).join(' · ') || 'No code'}</Text></Box></Flex>
              <Flex align="center" gap={1}><Chip>{u.peopleCount}</Chip><Actions u={u} {...actions} /></Flex>
            </Flex>
          </Panel>))}
      </Stack>
    </>
  );
}
