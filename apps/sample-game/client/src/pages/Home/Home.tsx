import React from 'react';

import { Container } from '@mantine/core';

import { GameContainer } from '@/features/game/components/GameContainer';

export const HomePage: React.FC = () => {
  return (
    <Container>
      <GameContainer />
    </Container>
  );
};
