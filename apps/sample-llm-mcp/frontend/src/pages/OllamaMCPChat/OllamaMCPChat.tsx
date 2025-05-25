import React from 'react';

import { Container } from '@mantine/core';

import { Ollama } from '@/features/ollama/Ollama';

export const OllamaMCPChat: React.FC = () => {
  return (
    <Container ta="left">
      <Ollama mode="mcp" />
    </Container>
  );
};
