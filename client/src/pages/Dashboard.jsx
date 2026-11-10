import { Link as RouterLink, Navigate } from 'react-router-dom';
import { Box, Button, Flex, Grid, HStack, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Map, Location, People, UserAdd, Calendar, SearchNormal1 } from 'iconsax-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { Chip, EmptyState, PageHeader, PersonAvatar, Panel, StatCard } from '../components/common/ui';
import ContactActions from '../components/people/ContactActions';
import { fmtDate } from '../utils/format';
import { flatNav } from '../components/navigation/navItems';
import { isMac } from '../components/search/GlobalSearch';
import { T } from '../theme';

export function HomeRedirect() {
  const { can, user } = useAuth();
  if (can('dashboard.view')) return <Dashboard />;
  const first = flatNav.find((n) => n.to !== '/' && can(n.perm));
  return <Navigate to={first?.to || '/settings'} replace state={{ from: user?.id }} />;
}

function Dashboard() {
  const { can, user } = useAuth();
  const stats = useFetch('/dashboard/stats');
  const recent = useFetch('/dashboard/recent-people', {}, { enabled: can('people.view') });
  const wards = useFetch('/dashboard/ward-summary', {}, { enabled: can('wards.view') });
  const s = stats.data || {};
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const cards = [
    can('people.view') && <StatCard key="p" label="Total people" value={s.totalPeople} icon={<People size={20} />} loading={stats.loading} />,
    can('wards.view') && <StatCard key="w" label="Total wards" value={s.totalWards} icon={<Map size={20} />} loading={stats.loading} />,
    can('pollingUnits.view') && <StatCard key="u" label="Polling units" value={s.totalPollingUnits} icon={<Location size={20} />} loading={stats.loading} />,
    can('people.view') && <StatCard key="r" label="Added in last 7 days" value={s.recentRegistrations} icon={<Calendar size={20} />} loading={stats.loading} />,
  ].filter(Boolean);

  return (
    <>
      <PageHeader title={`${greet}, ${user.fullName.split(' ')[0]}`} subtitle="Here’s what’s in the directory today" />
      <Panel p={{ base: 3, md: 4 }} mb={5} as="button" w="full" textAlign="left" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: !isMac, metaKey: isMac }))} aria-label="Open search">
        <Flex align="center" gap={3} color={T.muted}><SearchNormal1 size={20} /><Text fontSize="15px">Search people, wards or polling units</Text></Flex>
      </Panel>
      {cards.length > 0 && <SimpleGrid columns={{ base: 2, lg: cards.length > 3 ? 4 : cards.length }} spacing={{ base: 3, md: 4 }} mb={5}>{cards}</SimpleGrid>}

      <Grid templateColumns={{ base: '1fr', xl: '1.5fr 1fr' }} gap={5} alignItems="start">
        {can('people.view') && (
          <Panel>
            <Flex justify="space-between" align="center" p={4} pb={2}><Text fontWeight={600} fontSize="16px">Recent registrations</Text><Button as={RouterLink} to="/people" variant="ghost" size="sm">View all</Button></Flex>
            {recent.loading && !recent.data ? <Stack p={4}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} h="48px" borderRadius="10px" />)}</Stack>
              : !recent.data?.length ? <EmptyState title="No registrations yet" text="People you add will appear here." />
              : <Stack spacing={0} pb={2}>{recent.data.map((p) => (
                <Flex key={p.id} as={RouterLink} to={`/people/${p.id}`} align="center" gap={3} px={4} py={2.5} _hover={{ bg: '#FAFBFE' }}>
                  <PersonAvatar name={p.fullName} />
                  <Box flex={1} minW={0}><Text fontWeight={600} noOfLines={1}>{p.fullName}</Text><HStack spacing={1.5} mt={0.5} wrap="wrap"><Chip>{p.ward?.name}</Chip><Chip>{p.pollingUnit?.name}</Chip></HStack></Box>
                  <Text color={T.muted} fontSize="12px" display={{ base: 'none', sm: 'block' }}>{fmtDate(p.createdAt)}</Text>
                  <ContactActions person={p} />
                </Flex>))}</Stack>}
          </Panel>
        )}
        <Stack spacing={5}>
          {can(['people.create', 'wards.create', 'pollingUnits.create', 'people.view']) && (
            <Panel p={4}>
              <Text fontWeight={600} fontSize="16px" mb={3}>Quick actions</Text>
              <SimpleGrid columns={2} spacing={2}>
                {can('people.create') && <Button as={RouterLink} to="/people?new=1" leftIcon={<UserAdd size={18} />} size="sm" h="40px">Add person</Button>}
                {can('wards.create') && <Button as={RouterLink} to="/wards?new=1" leftIcon={<Map size={18} />} variant="soft" h="40px">Create ward</Button>}
                {can('pollingUnits.create') && <Button as={RouterLink} to="/polling-units?new=1" leftIcon={<Location size={18} />} variant="soft" h="40px">Add polling unit</Button>}
                {can('people.view') && <Button as={RouterLink} to="/people" leftIcon={<People size={18} />} variant="outline" h="40px">View people</Button>}
              </SimpleGrid>
            </Panel>
          )}
          {can('wards.view') && (
            <Panel>
              <Flex justify="space-between" align="center" p={4} pb={2}><Text fontWeight={600} fontSize="16px">Ward overview</Text><Button as={RouterLink} to="/wards" variant="ghost" size="sm">View all</Button></Flex>
              {wards.loading && !wards.data ? <Stack p={4}>{[1, 2, 3].map((i) => <Skeleton key={i} h="40px" borderRadius="10px" />)}</Stack>
                : !wards.data?.length ? <EmptyState title="No wards yet" text="Create your first ward to get started." />
                : <Stack spacing={0} pb={2} maxH="360px" overflowY="auto">{wards.data.map((w) => (
                  <Flex key={w.id} as={RouterLink} to={`/wards/${w.id}`} justify="space-between" align="center" px={4} py={2.5} _hover={{ bg: '#FAFBFE' }}>
                    <Text fontWeight={500} noOfLines={1}>{w.name}</Text>
                    <Text color={T.muted} fontSize="13px" flexShrink={0}>{w.pollingUnitCount} units · {w.peopleCount} people</Text>
                  </Flex>))}</Stack>}
            </Panel>
          )}
        </Stack>
      </Grid>
    </>
  );
}
export default Dashboard;
