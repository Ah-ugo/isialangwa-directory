import { useEffect, useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Box, Drawer, DrawerBody, DrawerContent, DrawerOverlay, Flex, HStack, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text, useDisclosure, Button, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, FormControl, FormLabel, Input, FormErrorMessage, Alert, AlertIcon } from '@chakra-ui/react';
import { Logout, More, SearchNormal1, Setting2, ArrowDown2 } from 'iconsax-react';
import { useAuth } from '../../context/AuthContext';
import { NAV, flatNav } from '../navigation/navItems';
import { CommandPalette, SearchTrigger } from '../search/GlobalSearch';
import api, { errMsg } from '../../services/api';
import { T } from '../../theme';
import { ApcLogo } from '../common/ui';
import { APP_NAME } from '../../branding';

const SIDEBAR_W = '248px';

function NavItem({ item, onClick }) {
  return (
    <NavLink to={item.to} end={item.to === '/'} onClick={onClick}>
      {({ isActive }) => (
        <Flex align="center" gap={3} h="38px" px={3} borderRadius="10px" fontWeight={isActive ? 600 : 500} bg={isActive ? T.primaryLight : 'transparent'} color={isActive ? T.primary : '#4A5468'} _hover={{ bg: isActive ? T.primaryLight : '#F1F3F9' }} transition="background .15s">
          <item.icon size={19} variant={isActive ? 'Bold' : 'Linear'} />
          <Text fontSize="14px">{item.label}</Text>
        </Flex>
      )}
    </NavLink>
  );
}

function Brand() {
  return (
    <Box px={2} mb={6}>
      <Flex align="center" gap={3}>
        <ApcLogo size={38} />
        <Box lineHeight="1.15">
          <Text fontWeight={700} fontSize="13px" letterSpacing="0.02em">APC YES,</Text>
          <Text color={T.muted} fontSize="11px" letterSpacing="0.04em">ISIALA NGWA SOUTH</Text>
        </Box>
      </Flex>
      <Flex h="3px" mt={4} borderRadius="full" overflow="hidden" aria-hidden="true">
        <Box flex={1} bg={T.primary} /><Box flex={1} bg={T.brandBlue} /><Box flex={1} bg={T.brandRed} />
      </Flex>
    </Box>
  );
}

function Sidebar() {
  const { can } = useAuth();
  return (
    <Box as="nav" aria-label="Main navigation" display={{ base: 'none', lg: 'block' }} position="fixed" top={0} left={0} bottom={0} w={SIDEBAR_W} bg="white" borderRight="1px solid" borderColor={T.border} p={4} overflowY="auto">
      <Brand />
      {NAV.map((g) => {
        const items = g.items.filter((i) => can(i.perm));
        if (!items.length) return null;
        return (
          <Box key={g.group} mb={5}>
            <Text color={T.muted} fontSize="12px" fontWeight={500} px={3} mb={1}>{g.group}</Text>
            <Flex direction="column" gap={0.5}>{items.map((i) => <NavItem key={i.to} item={i} />)}</Flex>
          </Box>
        );
      })}
    </Box>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <Menu placement="bottom-end">
      <MenuButton as={Button} variant="ghost" h="40px" px={2} rightIcon={<ArrowDown2 size={14} />} aria-label="Account menu">
        <HStack spacing={2}><Avatar size="sm" name={user.fullName} bg={T.primary} color="white" /><Text display={{ base: 'none', md: 'block' }} fontWeight={500} fontSize="14px" maxW="140px" noOfLines={1}>{user.fullName}</Text></HStack>
      </MenuButton>
      <MenuList>
        <Box px={3} py={2}><Text fontWeight={600} noOfLines={1}>{user.fullName}</Text><Text fontSize="12px" color={T.muted}>{user.role === 'super_admin' ? 'Super Admin' : 'Administrator'}</Text></Box>
        <MenuDivider />
        <MenuItem icon={<Setting2 size={18} />} onClick={() => nav('/settings')}>Settings</MenuItem>
        <MenuItem icon={<Logout size={18} />} color={T.danger} onClick={logout}>Sign out</MenuItem>
      </MenuList>
    </Menu>
  );
}

function MobileNavigation({ onMore }) {
  const { can } = useAuth();
  const items = [flatNav[0], flatNav[1], flatNav[2]].filter((i) => can(i.perm));
  return (
    <Flex as="nav" aria-label="Primary" display={{ base: 'flex', lg: 'none' }} position="fixed" bottom={0} left={0} right={0} zIndex={20} bg="white" borderTop="1px solid" borderColor={T.border} pb="env(safe-area-inset-bottom)" justify="space-around">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} style={{ flex: 1 }}>
          {({ isActive }) => (
            <Flex direction="column" align="center" justify="center" h="60px" gap={0.5} color={isActive ? T.primary : T.muted} fontWeight={isActive ? 600 : 500}>
              <i.icon size={22} variant={isActive ? 'Bold' : 'Linear'} /><Text fontSize="11px">{i.label === 'Dashboard' ? 'Home' : i.label}</Text>
            </Flex>
          )}
        </NavLink>
      ))}
      <Flex as="button" flex={1} direction="column" align="center" justify="center" h="60px" gap={0.5} color={T.muted} fontWeight={500} onClick={onMore} aria-label="More">
        <More size={22} /><Text fontSize="11px">More</Text>
      </Flex>
    </Flex>
  );
}

function MoreDrawer({ isOpen, onClose }) {
  const { can, logout } = useAuth();
  const primary = flatNav.slice(0, 3).map((i) => i.to);
  const items = flatNav.filter((i) => !primary.includes(i.to) && can(i.perm));
  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
      <DrawerOverlay bg="blackAlpha.500" />
      <DrawerContent borderTopRadius="20px" pb="env(safe-area-inset-bottom)">
        <DrawerBody p={4}>
          <Box w="36px" h="4px" bg="#DDE1EA" borderRadius="full" mx="auto" mb={4} />
          <Flex direction="column" gap={1}>{items.map((i) => <NavItem key={i.to} item={i} onClick={onClose} />)}
            <Flex as="button" align="center" gap={3} h="38px" px={3} borderRadius="10px" color={T.danger} fontWeight={500} onClick={logout}><Logout size={19} /><Text>Sign out</Text></Flex>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function ForcePasswordChange() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr('');
    try { const r = await api.put('/auth/change-password', f); setUser(r.data.data); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal isOpen={!!user?.mustChangePassword} onClose={() => {}} closeOnOverlayClick={false} closeOnEsc={false} isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4}>
        <ModalHeader>Set a new password</ModalHeader>
        <ModalBody pb={6}>
          <Alert status="info" borderRadius="10px" mb={4}><AlertIcon />You are using a temporary password. Choose your own to continue.</Alert>
          <FormControl mb={3} isInvalid={!!err}><FormLabel>Temporary password</FormLabel><Input type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></FormControl>
          <FormControl isInvalid={!!err}><FormLabel>New password</FormLabel><Input type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /><FormErrorMessage>{err}</FormErrorMessage></FormControl>
          <Button mt={5} w="full" onClick={submit} isLoading={busy} isDisabled={!f.currentPassword || !f.newPassword}>Save password</Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function AppLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const more = useDisclosure();
  const { settings } = useAuth();
  const loc = useLocation();

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onOpen(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onOpen]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  return (
    <Box minH="100vh">
      <Sidebar />
      <Box ml={{ base: 0, lg: SIDEBAR_W }}>
        <Flex as="header" position="sticky" top={0} zIndex={10} h="60px" px={{ base: 4, md: 8 }} align="center" justify="space-between" gap={3} bg="rgba(247,248,252,0.9)" backdropFilter="blur(10px)" borderBottom="1px solid" borderColor={T.border}>
          <HStack display={{ base: 'flex', lg: 'none' }} as={RouterLink} to="/" spacing={1.5} flex={1} minW={0} overflow="hidden">
            <ApcLogo size={21} />
            <Box minW={0} lineHeight="1.1">
              <Text fontWeight={700} fontSize="11px" noOfLines={1}>{settings?.appName || APP_NAME}</Text>
              <Text color={T.muted} fontSize="9px" noOfLines={1}>CONTACT DIRECTORY</Text>
            </Box>
          </HStack>
          <Box flex={1} display={{ base: 'none', lg: 'block' }}><SearchTrigger onOpen={onOpen} /></Box>
          <HStack spacing={1}>
            <IconButton display={{ base: 'inline-flex', lg: 'none' }} aria-label="Search" variant="ghost" icon={<SearchNormal1 size={21} />} onClick={onOpen} />
            <ProfileMenu />
          </HStack>
        </Flex>
        <Box as="main" px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} pb={{ base: '92px', lg: 10 }} maxW="1280px" mx="auto">
          <Outlet />
        </Box>
      </Box>
      <MobileNavigation onMore={more.onOpen} />
      <MoreDrawer isOpen={more.isOpen} onClose={more.onClose} />
      <CommandPalette isOpen={isOpen} onClose={onClose} />
      <ForcePasswordChange />
    </Box>
  );
}
