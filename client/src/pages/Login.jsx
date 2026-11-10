import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Button, Flex, FormControl, FormLabel, Heading, IconButton, Input, InputGroup, InputRightElement, Stack, Text, Alert, AlertIcon } from '@chakra-ui/react';
import { Eye, EyeSlash } from 'iconsax-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import { T } from '../theme';
import { ApcLogo } from '../components/common/ui';
import { APP_NAME } from '../branding';

export default function Login() {
  const { user, login, settings } = useAuth();
  const nav = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await login(id, pw); nav('/', { replace: true }); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }} bg={{ base: T.bg, lg: 'white' }} overflowX="hidden">
      <Flex
        flex={{ lg: '0 0 44%' }}
        minH={{ base: '224px', sm: '248px', lg: '100vh' }}
        position="relative"
        overflow="hidden"
        bg="linear-gradient(145deg, #005E29 0%, #00873D 60%, #07964B 100%)"
        color="white"
        direction="column"
        justify="space-between"
        px={{ base: 5, sm: 7, lg: 12, xl: 16 }}
        py={{ base: 5, sm: 6, lg: 10, xl: 14 }}
      >
        <Box
          position="absolute"
          inset={0}
          backgroundImage="linear-gradient(145deg, rgba(0,70,30,.78), rgba(0,112,49,.78)), url('/branding/login-banner.jpg')"
          backgroundSize="cover"
          backgroundPosition={{ base: 'center 38%', lg: '24% center' }}
          aria-hidden="true"
        />
        <Box position="absolute" w="360px" h="360px" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" right="-190px" top="-190px" aria-hidden="true" />
        <Box position="absolute" w="250px" h="250px" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" right="-135px" top="-135px" aria-hidden="true" />
        <Flex align="center" gap={3} position="relative">
          <Box bg="white" borderRadius="12px" p={1.5} boxShadow="0 8px 24px rgba(0,0,0,.12)"><ApcLogo size={38} /></Box>
          <Box lineHeight="1.2">
            <Text fontWeight={700} letterSpacing="0.03em" fontSize={{ base: '12px', sm: '13px' }}>{settings?.appName || APP_NAME}</Text>
            <Text color="#D6EBDD" fontSize="11px" mt={1}>Contact directory</Text>
          </Box>
        </Flex>
        <Box maxW="500px" position="relative" mt={{ base: 6, lg: 0 }}>
          <Text fontSize="10px" fontWeight={700} letterSpacing="0.16em" color="#BEE4CA" mb={2}>ISIALA NGWA SOUTH</Text>
          <Heading fontSize={{ base: '25px', sm: '29px', lg: 'clamp(38px, 4vw, 54px)' }} fontWeight={700} letterSpacing="-0.035em" lineHeight="1.08">
            Your community directory, organised.
          </Heading>
          <Text display={{ base: 'none', sm: 'block' }} mt={{ sm: 3, lg: 5 }} fontSize={{ sm: '14px', lg: '16px' }} color="#E4F4E9" lineHeight="1.65">
            Find authorised contact records by ward and polling unit in one clear workspace.
          </Text>
        </Box>
        <Flex display={{ base: 'none', lg: 'flex' }} gap={3} position="relative">
          <Box flex={1} bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" borderRadius="14px" p={4}>
            <Text fontWeight={600} fontSize="13px">Organised locally</Text>
            <Text color="#D6EBDD" fontSize="12px" mt={1}>Browse by ward and polling unit.</Text>
          </Box>
          <Box flex={1} bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" borderRadius="14px" p={4}>
            <Text fontWeight={600} fontSize="13px">Access by role</Text>
            <Text color="#D6EBDD" fontSize="12px" mt={1}>Records are limited by permissions.</Text>
          </Box>
        </Flex>
        <Flex display={{ base: 'none', lg: 'flex' }} h="4px" maxW="180px" borderRadius="full" overflow="hidden" position="absolute" bottom={{ lg: 6, xl: 8 }} left={{ lg: 12, xl: 16 }} aria-hidden="true">
          <Box flex={1} bg="white" /><Box flex={1} bg={T.brandBlue} /><Box flex={1} bg={T.brandRed} />
        </Flex>
      </Flex>
      <Flex flex="1" align={{ base: 'flex-start', lg: 'center' }} justify="center" px={{ base: 4, sm: 6, lg: 10 }} py={{ base: 0, lg: 10 }} mt={{ base: -3, lg: 0 }} position="relative" zIndex={1}>
        <Box
          as="form"
          onSubmit={submit}
          w="full"
          maxW={{ base: '420px', lg: '540px', xl: '600px' }}
          bg="white"
          border="1px solid"
          borderColor={T.border}
          borderRadius={{ base: '20px', lg: '24px' }}
          boxShadow={{ base: '0 12px 32px rgba(23,32,51,.08)', lg: '0 24px 70px rgba(23,32,51,.10)' }}
          p={{ base: 5, sm: 7, lg: 11, xl: 12 }}
        >
          <Heading fontSize={{ base: '25px', lg: '34px', xl: '38px' }} fontWeight={700} letterSpacing="-0.03em">Welcome back</Heading>
          <Text color={T.muted} mt={2} mb={{ base: 6, lg: 8 }} fontSize={{ base: '14px', lg: '17px' }}>Sign in to your directory account.</Text>
          <Stack spacing={{ base: 5, lg: 5 }}>
            {err && <Alert status="error" borderRadius="10px"><AlertIcon />{err}</Alert>}
            <FormControl isRequired><FormLabel fontSize={{ base: '15px', lg: '15px' }}>Username or email</FormLabel><Input autoFocus autoComplete="username" h={{ base: '54px', lg: '48px' }} fontSize={{ base: '16px', lg: '15px' }} value={id} onChange={(e) => setId(e.target.value)} /></FormControl>
            <FormControl isRequired><FormLabel fontSize={{ base: '15px', lg: '15px' }}>Password</FormLabel>
              <InputGroup><Input type={show ? 'text' : 'password'} autoComplete="current-password" h={{ base: '54px', lg: '48px' }} fontSize={{ base: '16px', lg: '15px' }} value={pw} onChange={(e) => setPw(e.target.value)} />
                <InputRightElement h={{ base: '54px', lg: '48px' }}><IconButton size="sm" variant="ghost" aria-label={show ? 'Hide password' : 'Show password'} icon={show ? <EyeSlash size={20} /> : <Eye size={20} />} onClick={() => setShow(!show)} /></InputRightElement></InputGroup>
            </FormControl>
            <Button type="submit" size="lg" h={{ base: '52px', lg: '52px' }} fontSize={{ base: '16px', lg: '16px' }} mt={1} isLoading={busy} loadingText="Signing in">Sign in</Button>
          </Stack>
          <Text textAlign="center" color={T.muted} fontSize={{ base: '11px', lg: '13px' }} mt={{ base: 5, lg: 7 }}>Need access? Contact your Super Admin.</Text>
        </Box>
      </Flex>
    </Flex>
  );
}
