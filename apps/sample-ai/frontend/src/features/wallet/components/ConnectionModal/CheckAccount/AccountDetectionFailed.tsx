import React from 'react';

import { Alert, Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IoIosWarning } from 'react-icons/io';

interface AccountDetectionFailedProps {
  errorMessage: string | null;
}
export const AccountDetectionFailed: React.FC<AccountDetectionFailedProps> = ({
  errorMessage,
}) => {
  const { t } = useTranslation('FeatureWallet');
  return (
    <Container>
      <Alert icon={<IoIosWarning />} title={t('Unexpected Error')} color="red">
        <Text size="sm">
          {t('An error has occured during the wallet status check.')}
          <br />
          {t('Please try again later.')}
          <br />
          {t('The error code was:')} {errorMessage}
        </Text>
      </Alert>
    </Container>
  );
};
