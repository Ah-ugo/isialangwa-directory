import { Component } from 'react';
import { Button, Flex, Text } from '@chakra-ui/react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { console.error(e); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Flex minH="60vh" direction="column" align="center" justify="center" gap={3} p={6} textAlign="center">
        <Text fontWeight={600} fontSize="18px">This page hit a problem</Text>
        <Text color="#788197">Reload to try again. Your data is safe.</Text>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </Flex>
    );
  }
}
