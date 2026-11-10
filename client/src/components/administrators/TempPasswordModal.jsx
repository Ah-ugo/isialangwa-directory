import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, Code, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import { Copy, TickCircle } from 'iconsax-react';

export default function TempPasswordModal({ isOpen, onClose, name, password }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent mx={4}>
        <ModalHeader>Temporary password</ModalHeader><ModalCloseButton />
        <ModalBody>
          <Text mb={3}>Share this with <b>{name}</b> securely. They’ll be asked to choose a new password when they sign in.</Text>
          <Box p={4} bg="#F7F8FC" borderRadius="12px" textAlign="center"><Code fontSize="18px" bg="transparent" userSelect="all">{password}</Code></Box>
          <Alert status="warning" borderRadius="10px" mt={4}><AlertIcon />This is shown only once. It isn’t stored and can’t be shown again.</Alert>
        </ModalBody>
        <ModalFooter gap={2}><Button variant="outline" onClick={copy} leftIcon={copied ? <TickCircle size={18} /> : <Copy size={18} />}>{copied ? 'Copied' : 'Copy'}</Button><Button onClick={onClose}>Done</Button></ModalFooter>
      </ModalContent>
    </Modal>
  );
}
