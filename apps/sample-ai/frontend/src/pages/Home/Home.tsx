import React, { useState } from 'react';

import { Container, Stack, Image, Grid, Button, Progress } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import axios from 'axios';
import '@mantine/dropzone/styles.css';
import { useTranslation } from 'react-i18next';

import { Environment } from './components/Environment';

export const HomePage: React.FC = () => {
  const { t } = useTranslation('PageHome');
  const [loading, setLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [filename, setFilename] = useState<string>();
  const [processedImage, setProcessedImage] = useState<string>();
  const [disabled, setDisabled] = useState<boolean>(true);

  const handleUpload = (file: File) => {
    setDisabled(true);
    setLoading(true);
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('image', file);
    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(res => {
        setFilename(res.data.message);
        setDisabled(false);
      })
      .catch(error => {
        console.log(error.message);
      })
      .finally(() => setLoading(false));
  };

  const handleProcess = () => {
    setProcessLoading(true);
    setProcessedImage('');
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL}/process/${filename}`,
        {},
        {
          responseType: 'blob',
        }
      )
      .then(res => {
        setProcessedImage(URL.createObjectURL(res.data));
      })
      .catch(error => {
        console.log(error.message);
      })
      .finally(() => {
        setLoading(false);
        setProcessLoading(false);
      });
  };

  return (
    <Container ta="center">
      <Stack ta="center" py={{ base: 10, md: 16 }}>
        <Grid>
          <Grid.Col span={4}>
            <Dropzone
              accept={[MIME_TYPES.jpeg, MIME_TYPES.png]}
              onDrop={files => handleUpload(files[0])}
              loading={loading}
            >
              {loading ? t('Uploading image...') : t('Drop image here')}
              {preview && (
                <Image radius="md" src={preview} h={200} fit="contain" />
              )}
            </Dropzone>
          </Grid.Col>
          <Grid.Col
            span={4}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Button
              disabled={disabled}
              loading={processLoading}
              onClick={handleProcess}
            >
              {t('Remove Background')}
            </Button>
          </Grid.Col>
          <Grid.Col
            span={4}
            style={{
              border: '1px dashed gray',
              borderRadius: 4,
              backgroundColor: '#efefef',
            }}
          >
            {processedImage && (
              <Image radius="md" src={processedImage} h={200} fit="contain" />
            )}
            {processLoading && (
              <Progress.Root size="xl">
                <Progress.Section animated value={100}>
                  <Progress.Label>{t('removing background...')}</Progress.Label>
                </Progress.Section>
              </Progress.Root>
            )}
          </Grid.Col>
        </Grid>
        <Environment />
      </Stack>
    </Container>
  );
};
