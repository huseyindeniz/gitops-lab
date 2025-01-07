import { useState } from 'react';

import { Button, Stack, Alert, Container } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { engineConfig } from '../core/engineConfig';

export const GameContainer = () => {
  const { t } = useTranslation('FeatureGame');
  const [gameLoading, setGameLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleStartGame = () => {
    setError('');
    setGameLoading(true);
    try {
      new Phaser.Game(engineConfig);
      setGameLoading(false);
      /*
      gameInstance.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, () => {
        setGameLoading(false);
        // setGameRunning(true);
        gameInstance.scale.resize(screen.width, screen.height);
      });

      gameInstance.scale.startFullscreen();
      */
    } catch (e) {
      setError(
        'An unexpected error occured. Please inform darthitect with screenshot'
      );
    }
  };
  return (
    <Stack>
      <Button
        onClick={handleStartGame}
        size="lg"
        color="red"
        loading={gameLoading}
        disabled={gameLoading}
      >
        {t('Start the game as guest')}
      </Button>
      <Container id="phaser-container" />
      {error && (
        <Alert title="Fullscreen Mode Failed" color="error">
          {t('Can not enter to fullscreen mode.')}
        </Alert>
      )}
    </Stack>
  );
};
