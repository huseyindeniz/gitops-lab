import React from 'react';

import { Alert, Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IoIosWarning } from 'react-icons/io';

export interface SignFailedProps {
  errorMessage: string | null;
}
export const SignFailed: React.FC<SignFailedProps> = ({ errorMessage }) => {
  const { t } = useTranslation('FeatureWallet');
  return (
    <Container>
      <Alert icon={<IoIosWarning />} title={t('Unexpected Error')} color="red">
        <Text size="sm">
          {t('An error has occured during the sign check.')}
          <br />
          {t('Please try again later.')}
          <br />
          {t('The error code was:')} {errorMessage}
        </Text>
      </Alert>
    </Container>
  );
};
