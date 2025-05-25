import React from 'react';

import { Container } from '@mantine/core';

import { Ollama } from '@/features/ollama/Ollama';

export const OllamaChat: React.FC = () => {
  return (
    <Container ta="left">
      <Ollama mode="simple" />
    </Container>
  );
};
