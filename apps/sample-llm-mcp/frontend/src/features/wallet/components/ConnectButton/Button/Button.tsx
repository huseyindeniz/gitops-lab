import React from 'react';

import { Button as MantineButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { FaWallet } from 'react-icons/fa';

export interface ButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const Button: React.FC<ButtonProps> = ({ onClick, isLoading }) => {
  const { t } = useTranslation('FeatureWallet');
  return (
    <MantineButton
      ml={2}
      variant="filled"
      loading={isLoading}
      color="yellow"
      leftSection={<FaWallet />}
      onClick={() => onClick()}
      role="button"
      autoContrast
    >
      {t('Connect')}
    </MantineButton>
  );
};
