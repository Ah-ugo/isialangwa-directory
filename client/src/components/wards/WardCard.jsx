import { Box, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { Edit2, More, Trash, Map } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { Chip, Panel } from '../common/ui';
import { fmtDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { T } from '../../theme';

export default function WardCard({ ward, onEdit, onDelete }) {
  const nav = useNavigate();
  const { can } = useAuth();
  const go = () => nav(`/wards/${ward.id}`);
  return (
    <Panel p={4} cursor="pointer" onClick={go} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && go()} _hover={{ borderColor: '#D5DAE6', boxShadow: '0 4px 14px rgba(23,32,51,.06)' }} transition="all .15s">
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Flex gap={3} minW={0}>
          <Flex w="40px" h="40px" borderRadius="12px" bg={T.primaryLight} color={T.primary} align="center" justify="center" flexShrink={0}><Map size={20} /></Flex>
          <Box minW={0}><Text fontWeight={600} fontSize="15px" noOfLines={1}>{ward.name}</Text><Text color={T.muted} fontSize="13px">{ward.code ? `Code ${ward.code}` : 'No code'}</Text></Box>
        </Flex>
        {(can('wards.edit') || can('wards.delete')) && (
          <Menu placement="bottom-end">
            <MenuButton as={IconButton} aria-label={`Actions for ${ward.name}`} icon={<More size={18} />} variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} />
            <MenuList onClick={(e) => e.stopPropagation()}>
              {can('wards.edit') && <MenuItem icon={<Edit2 size={17} />} onClick={() => onEdit(ward)}>Edit ward</MenuItem>}
              {can('wards.delete') && <MenuItem icon={<Trash size={17} />} color={T.danger} onClick={() => onDelete(ward)}>Delete ward</MenuItem>}
            </MenuList>
          </Menu>
        )}
      </Flex>
      <Flex gap={2} mt={4} wrap="wrap"><Chip>{ward.pollingUnitCount} polling units</Chip><Chip>{ward.peopleCount} people</Chip></Flex>
      <Text color={T.muted} fontSize="12px" mt={3}>Created {fmtDate(ward.createdAt)}</Text>
    </Panel>
  );
}
