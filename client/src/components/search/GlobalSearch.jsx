import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Kbd,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { SearchNormal1, UserAdd, Map, Location, People } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { flatNav } from '../navigation/navItems';
import { Highlight } from '../common/ui';
import { T } from '../../theme';

export const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform);

export function SearchTrigger({ onOpen }) {
  return (
    <Flex
      as="button"
      type="button"
      onClick={onOpen}
      aria-label="Open search"
      align="center"
      gap={2}
      h="40px"
      px={3}
      w="full"
      maxW="440px"
      bg="white"
      border="1px solid"
      borderColor={T.border}
      borderRadius="10px"
      color={T.muted}
      _hover={{ borderColor: '#D5DAE6' }}
      textAlign="left"
    >
      <SearchNormal1 size={18} />
      <Text flex={1} fontSize="14px">
        Search people, wards, polling units…
      </Text>
      <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
        <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
        <Kbd>K</Kbd>
      </HStack>
    </Flex>
  );
}

export function CommandPalette({ isOpen, onClose }) {
  const nav = useNavigate();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const dq = useDebounce(q, 250);
  const listRef = useRef();

  useEffect(() => {
    if (!isOpen) {
      setQ('');
      setRes(null);
      setIdx(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (dq.trim().length < 2) {
      setRes(null);
      setLoading(false);
      return undefined;
    }
    const ctrl = new AbortController();
    setLoading(true);
    api
      .get('/search', { params: { q: dq.trim() }, signal: ctrl.signal })
      .then((r) => {
        setRes(r.data.data);
        setLoading(false);
        setIdx(0);
      })
      .catch((e) => {
        if (!axios.isCancel(e)) setLoading(false);
      });
    return () => ctrl.abort();
  }, [dq]);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cmds = [
      ...flatNav
        .filter((n) => can(n.perm))
        .map((n) => ({
          kind: 'Go to',
          label: n.label,
          to: n.to,
          icon: <n.icon size={18} />,
        })),
      ...(can('people.create')
        ? [
            {
              kind: 'Action',
              label: 'Add person',
              to: '/people?new=1',
              icon: <UserAdd size={18} />,
            },
          ]
        : []),
      ...(can('wards.create')
        ? [
            {
              kind: 'Action',
              label: 'Create ward',
              to: '/wards?new=1',
              icon: <Map size={18} />,
            },
          ]
        : []),
      ...(can('pollingUnits.create')
        ? [
            {
              kind: 'Action',
              label: 'Add polling unit',
              to: '/polling-units?new=1',
              icon: <Location size={18} />,
            },
          ]
        : []),
    ];
    if (query.length < 2) return cmds;
    const matched = cmds.filter((c) => c.label.toLowerCase().includes(query));
    const out = [];
    (res?.people || []).forEach((p) =>
      out.push({
        kind: 'People',
        label: p.fullName,
        sub: [p.phone, p.ward, p.pollingUnit].filter(Boolean).join(' · '),
        to: `/people/${p.id}`,
        icon: <People size={18} />,
      }),
    );
    (res?.wards || []).forEach((w) =>
      out.push({
        kind: 'Wards',
        label: w.name,
        sub: w.code,
        to: `/wards/${w.id}`,
        icon: <Map size={18} />,
      }),
    );
    (res?.pollingUnits || []).forEach((u) =>
      out.push({
        kind: 'Polling units',
        label: u.name,
        sub: [u.code, u.ward].filter(Boolean).join(' · '),
        to: `/people?wardId=${u.wardId}&pollingUnitId=${u.id}`,
        icon: <Location size={18} />,
      }),
    );
    return [...out, ...matched];
  }, [q, res, can]);

  const go = (it) => {
    onClose();
    nav(it.to);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && items[idx]) {
      e.preventDefault();
      go(items[idx]);
    }
  };
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  let last = null;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      scrollBehavior="inside"
      motionPreset="scale"
    >
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent
        mx={3}
        mt={{ base: 4, md: '12vh' }}
        borderRadius="16px"
        overflow="hidden"
        onKeyDown={onKey}
      >
        <ModalCloseButton aria-label="Close search" zIndex={1} />
        <Flex
          align="center"
          gap={3}
          px={4}
          h="56px"
          borderBottom="1px solid"
          borderColor={T.border}
        >
          <SearchNormal1 size={20} color={T.muted} />
          <Input
            variant="unstyled"
            autoFocus
            pr={10}
            placeholder="Search by name, phone, ward or polling unit"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            _focusVisible={{ outline: 'none' }}
          />
          {loading && <Spinner size="sm" color={T.primary} />}
        </Flex>
        <Box
          id="palette-list"
          role="listbox"
          ref={listRef}
          maxH="50vh"
          overflowY="auto"
          p={2}
        >
          {items.length === 0 && !loading && (
            <Text color={T.muted} textAlign="center" py={8}>
              No results for “{q}”
            </Text>
          )}
          {items.map((it, i) => {
            const header = it.kind !== last ? it.kind : null;
            last = it.kind;
            return (
              <Box key={it.kind + it.to + i}>
                {header && (
                  <Text
                    color={T.muted}
                    fontSize="12px"
                    fontWeight={500}
                    px={3}
                    pt={2}
                    pb={1}
                  >
                    {header}
                  </Text>
                )}
                <Flex
                  role="option"
                  aria-selected={i === idx}
                  data-active={i === idx}
                  align="center"
                  gap={3}
                  px={3}
                  py={2}
                  borderRadius="10px"
                  cursor="pointer"
                  bg={i === idx ? T.primaryLight : 'transparent'}
                  color={i === idx ? T.primary : T.text}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(it)}
                >
                  {it.icon}
                  <Box minW={0}>
                    <Text fontWeight={500} noOfLines={1}>
                      <Highlight text={it.label} query={q} />
                    </Text>
                    {it.sub && (
                      <Text fontSize="12px" color={T.muted} noOfLines={1}>
                        {it.sub}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </Box>
        <Flex
          px={4}
          py={2}
          borderTop="1px solid"
          borderColor={T.border}
          gap={4}
          color={T.muted}
          fontSize="12px"
          display={{ base: 'none', md: 'flex' }}
        >
          <HStack>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Text>to move</Text>
          </HStack>
          <HStack>
            <Kbd>Enter</Kbd>
            <Text>to open</Text>
          </HStack>
          <HStack>
            <Kbd>Esc</Kbd>
            <Text>to close</Text>
          </HStack>
        </Flex>
      </ModalContent>
    </Modal>
  );
}
