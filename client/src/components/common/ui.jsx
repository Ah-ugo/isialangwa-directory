import { Avatar, Badge, Box, Button, Flex, Heading, HStack, IconButton, Input, InputGroup, InputLeftElement, InputRightElement, Skeleton, Stack, Text, Tag } from '@chakra-ui/react';
import { ArrowLeft2, ArrowRight2, CloseCircle, SearchNormal1 } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../theme';
import { APC_LOGO_URL } from '../../branding';

export const Panel = ({ children, ...p }) => (
  <Box bg="white" border="1px solid" borderColor={T.border} borderRadius="16px" boxShadow="0 1px 2px rgba(23,32,51,0.04)" {...p}>{children}</Box>
);

export function PageHeader({ title, subtitle, actions, back }) {
  const nav = useNavigate();
  return (
    <Flex mb={{ base: 4, md: 6 }} gap={3} direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} justify="space-between">
      <HStack spacing={3} minW={0}>
        {back && <IconButton aria-label="Go back" icon={<ArrowLeft2 size={18} />} variant="outline" size="sm" onClick={() => nav(typeof back === 'string' ? back : -1)} />}
        <Box minW={0}>
          <Heading as="h1" fontSize={{ base: '22px', md: '26px' }} fontWeight={700} letterSpacing="-0.02em" noOfLines={1}>{title}</Heading>
          {subtitle && <Text color={T.muted} fontSize="13px" mt={0.5}>{subtitle}</Text>}
        </Box>
      </HStack>
      {actions && <HStack spacing={2} flexShrink={0}>{actions}</HStack>}
    </Flex>
  );
}

export function StatCard({ label, value, icon, loading }) {
  return (
    <Panel p={4}>
      <Flex justify="space-between" align="center">
        <Box>
          <Text color={T.muted} fontSize="13px">{label}</Text>
          {loading ? <Skeleton h="28px" w="60px" mt={1} /> : <Text fontSize="26px" fontWeight={700} letterSpacing="-0.02em" lineHeight="1.3">{(value ?? 0).toLocaleString('en-NG')}</Text>}
        </Box>
        <Flex w="40px" h="40px" borderRadius="12px" bg={T.primaryLight} color={T.primary} align="center" justify="center">{icon}</Flex>
      </Flex>
    </Panel>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <Flex direction="column" align="center" textAlign="center" py={14} px={6}>
      {icon && <Flex w="52px" h="52px" borderRadius="16px" bg={T.primaryLight} color={T.primary} align="center" justify="center" mb={4}>{icon}</Flex>}
      <Text fontWeight={600} fontSize="16px">{title}</Text>
      {text && <Text color={T.muted} mt={1} maxW="380px">{text}</Text>}
      {action && <Box mt={5}>{action}</Box>}
    </Flex>
  );
}

export const LoadingSkeleton = ({ rows = 5, h = '56px' }) => (
  <Stack spacing={3} p={4}>{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} h={h} borderRadius="12px" />)}</Stack>
);

const STATUS = { active: ['green', 'Active'], inactive: ['red', 'Inactive'], granted: ['green', 'Consent given'], withdrawn: ['orange', 'Consent withdrawn'], valid: ['green', 'Ready'], duplicate: ['orange', 'Possible duplicate'], error: ['red', 'Error'] };
export function StatusBadge({ status, label }) {
  const [c, l] = STATUS[status] || ['gray', status];
  return <Badge colorScheme={c} variant="subtle">{label || l}</Badge>;
}

export function PersonAvatar({ name, size = 'sm' }) {
  return <Avatar name={name} size={size} bg={T.primaryLight} color={T.primary} fontWeight={600} />;
}

export function SearchInput({ value, onChange, placeholder = 'Search', ...rest }) {
  return (
    <InputGroup {...rest}>
      <InputLeftElement h="40px" pointerEvents="none" color={T.muted}><SearchNormal1 size={18} /></InputLeftElement>
      <Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <InputRightElement h="40px"><IconButton aria-label="Clear search" size="xs" variant="ghost" icon={<CloseCircle size={16} />} onClick={() => onChange('')} /></InputRightElement>
      )}
    </InputGroup>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.total, meta.page * meta.limit);
  return (
    <Flex justify="space-between" align="center" px={4} py={3} borderTop="1px solid" borderColor={T.border} gap={3}>
      <Text color={T.muted} fontSize="13px">{from}–{to} of {meta.total.toLocaleString('en-NG')}</Text>
      <HStack>
        <IconButton aria-label="Previous page" size="sm" variant="outline" icon={<ArrowLeft2 size={16} />} isDisabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} />
        <Text fontSize="13px" minW="64px" textAlign="center">Page {meta.page} / {meta.pages}</Text>
        <IconButton aria-label="Next page" size="sm" variant="outline" icon={<ArrowRight2 size={16} />} isDisabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} />
      </HStack>
    </Flex>
  );
}

export function ErrorState({ message, onRetry }) {
  return <EmptyState title="We couldn’t load this" text={message} action={onRetry && <Button variant="soft" onClick={onRetry}>Try again</Button>} />;
}

export function Highlight({ text, query }) {
  if (!text) return null;
  const q = (query || '').trim();
  if (!q) return text;
  const i = String(text).toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<Box as="mark" bg="#FFF1C2" color="inherit" borderRadius="3px" px="1px">{text.slice(i, i + q.length)}</Box>{text.slice(i + q.length)}</>;
}

export const Chip = ({ children, ...p }) => <Tag size="sm" borderRadius="6px" bg="#F1F3F9" color={T.text} fontWeight={500} {...p}>{children}</Tag>;

export const ApcLogo = ({ size = 34 }) => (
  <Box as="img" src={APC_LOGO_URL} alt="APC logo" w={size} h={size} objectFit="contain" flexShrink={0} />
);
