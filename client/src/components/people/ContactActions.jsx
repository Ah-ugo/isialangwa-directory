import { HStack, IconButton, Tooltip } from '@chakra-ui/react';
import { Call, Message } from 'iconsax-react';
import { useAuth } from '../../context/AuthContext';
import { telLink, waLink } from '../../utils/format';
import { T } from '../../theme';

/** Opens the device dialler / WhatsApp. Never sends anything automatically. Needs viewPhone + the action permission + active consent. */
export default function ContactActions({ person, size = 'sm' }) {
  const { can } = useAuth();
  if (!person.phone || !person.contactable || !can('people.viewPhone')) return null;
  const stop = (e) => e.stopPropagation();
  return (
    <HStack spacing={1} onClick={stop}>
      {can('people.contact') && (
        <Tooltip label="Call" hasArrow><IconButton as="a" href={telLink(person.phone)} aria-label={`Call ${person.fullName}`} icon={<Call size={17} />} size={size} variant="soft" /></Tooltip>
      )}
      {can('people.whatsapp') && (
        <Tooltip label="WhatsApp" hasArrow><IconButton as="a" href={waLink(person.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${person.fullName}`} icon={<Message size={17} />} size={size} bg="#E6F8EE" color={T.whatsapp} _hover={{ bg: '#D3F2E1' }} /></Tooltip>
      )}
    </HStack>
  );
}
