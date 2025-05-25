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

export const McpChatScreen: React.FC = () => {
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
  } = useOllama('http://localhost:5215/chat');

  return (
    <Stack gap="md" p="md">
      <Title order={3}>MCP Chat</Title>
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
