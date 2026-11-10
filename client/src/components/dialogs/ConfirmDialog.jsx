import { useRef } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button } from '@chakra-ui/react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger, isLoading }) {
  const cancelRef = useRef();
  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
      <AlertDialogOverlay bg="blackAlpha.500">
        <AlertDialogContent mx={4} borderRadius="16px">
          <AlertDialogHeader fontSize="17px" fontWeight={600}>{title}</AlertDialogHeader>
          <AlertDialogBody color="#4A5468">{body}</AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} variant="outline" onClick={onClose} isDisabled={isLoading}>Cancel</Button>
            <Button colorScheme={danger ? 'red' : 'brand'} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
