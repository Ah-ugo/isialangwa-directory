import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Badge, Box, Button, Checkbox, Flex, HStack, Text, Stack } from '@chakra-ui/react';
import { PERMISSION_SECTIONS } from '../../utils/permissions';
import { T } from '../../theme';

export default function PermissionEditor({ value, onChange, isDisabled }) {
  const setSection = (key, v) => onChange({ ...value, [key]: { ...value[key], ...v } });
  return (
    <Accordion allowMultiple defaultIndex={[1]} borderColor="transparent">
      {PERMISSION_SECTIONS.map((s) => {
        const on = s.actions.filter(([a]) => value?.[s.key]?.[a]).length;
        return (
          <AccordionItem key={s.key} border="1px solid" borderColor={T.border} borderRadius="12px" mb={2} overflow="hidden">
            <AccordionButton h="48px" px={4} _hover={{ bg: '#FAFBFE' }}>
              <Text flex={1} textAlign="left" fontWeight={600}>{s.title}</Text>
              <Badge colorScheme={on ? 'blue' : 'gray'} mr={2}>{on}/{s.actions.length}</Badge>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px={4} pb={4}>
              {s.actions.length > 1 && !isDisabled && (
                <HStack mb={3} spacing={2}>
                  <Button size="xs" variant="soft" onClick={() => setSection(s.key, Object.fromEntries(s.actions.map(([a]) => [a, true])))}>Select all</Button>
                  <Button size="xs" variant="outline" onClick={() => setSection(s.key, Object.fromEntries(s.actions.map(([a]) => [a, false])))}>Clear</Button>
                </HStack>
              )}
              <Stack spacing={2.5}>
                {s.actions.map(([a, label]) => (
                  <Checkbox key={a} isChecked={!!value?.[s.key]?.[a]} isDisabled={isDisabled} onChange={(e) => setSection(s.key, { [a]: e.target.checked })}>{label}</Checkbox>
                ))}
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
