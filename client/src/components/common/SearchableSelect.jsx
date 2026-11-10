import { useMemo, useRef, useState } from 'react';
import { Box, Button, Input, Popover, PopoverBody, PopoverContent, PopoverTrigger, Text, useDisclosure } from '@chakra-ui/react';
import { ArrowDown2 } from 'iconsax-react';
import { T } from '../../theme';

/** Searchable single-select. options: [{ value, label }] */
export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Select', isDisabled, isLoading, searchPlaceholder = 'Search…', id }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [q, setQ] = useState('');
  const ref = useRef();
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())), [options, q]);
  const choose = (v) => { onChange(v); setQ(''); onClose(); };
  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={() => { onClose(); setQ(''); }} initialFocusRef={ref} matchWidth placement="bottom-start" isLazy>
      <PopoverTrigger>
        <Button id={id} variant="outline" w="full" justifyContent="space-between" fontWeight={400} isDisabled={isDisabled} isLoading={isLoading} rightIcon={<ArrowDown2 size={16} />} color={selected ? T.text : T.muted} aria-haspopup="listbox">
          <Text noOfLines={1}>{selected ? selected.label : placeholder}</Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent borderRadius="12px" borderColor={T.border} boxShadow="0 8px 24px rgba(23,32,51,.12)" w="full" _focusVisible={{ boxShadow: '0 8px 24px rgba(23,32,51,.12)' }}>
        <PopoverBody p={2}>
          <Input ref={ref} size="sm" placeholder={searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} mb={2} aria-label={searchPlaceholder} />
          <Box maxH="220px" overflowY="auto" role="listbox">
            {filtered.length === 0 && <Text color={T.muted} fontSize="13px" p={2}>No matches</Text>}
            {filtered.map((o) => (
              <Box key={o.value} role="option" aria-selected={o.value === value} tabIndex={0} px={3} py={2} borderRadius="8px" cursor="pointer" fontSize="14px" bg={o.value === value ? T.primaryLight : 'transparent'} color={o.value === value ? T.primary : T.text} _hover={{ bg: '#F3F5FA' }}
                onClick={() => choose(o.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(o.value); } }}>
                {o.label}
              </Box>
            ))}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
