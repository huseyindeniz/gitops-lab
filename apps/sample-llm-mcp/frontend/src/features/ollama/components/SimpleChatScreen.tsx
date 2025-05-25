import {
  Paper,
  TextInput,
  Button,
  Text,
  Select,
  Stack,
  Title,
} from '@mantine/core';

import { useOllama } from '../hooks/useOllama';

export const SimpleChatScreen: React.FC = () => {
  const {
    models,
    messages,
    input,
    currentModel,
    isLoading,
    sendPrompt,
    setInput,
    setCurrentModel,
    scrollRef,
  } = useOllama('http://localhost:11434/api/generate');

  return (
    <Stack gap="md" p="md">
      <Title order={2}>Simple Chat</Title>
      <Select
        label="Choose Model"
        data={models}
        value={currentModel}
        onChange={value => {
          setCurrentModel(value || 'mistral');
        }}
      />
      <Paper
        ref={scrollRef}
        shadow="xs"
        p="md"
        radius="md"
        h={400}
        withBorder
        style={{ overflowY: 'auto' }}
      >
        {messages.map((msg, idx) => (
          <Text key={idx} c={msg.role === 'user' ? 'blue' : 'green'}>
            <strong>{msg.role === 'user' ? 'You:' : 'Assistant:'}</strong>{' '}
            {msg.content}
          </Text>
        ))}
        {isLoading && (
          <Text fs="italic" c="dimmed">
            Assistant is typing...
          </Text>
        )}
      </Paper>
      <TextInput
        placeholder="Type your message"
        value={input}
        onChange={e => {
          setInput(e.currentTarget.value);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            sendPrompt();
          }
        }}
      />
      <Button
        onClick={() => {
          sendPrompt();
        }}
        loading={isLoading}
      >
        Send
      </Button>
    </Stack>
  );
};
