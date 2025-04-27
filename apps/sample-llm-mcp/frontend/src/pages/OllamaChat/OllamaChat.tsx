import React from 'react';

import { Container } from '@mantine/core';

import { ChatScreen } from './components/ChatScreen';

export const OllamaChat: React.FC = () => {
  return (
    <Container ta="left">
      <ChatScreen />
    </Container>
  );
};
