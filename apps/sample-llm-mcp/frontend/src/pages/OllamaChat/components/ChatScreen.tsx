import { useState, useRef } from 'react';

import { Paper, TextInput, Button, Text, Select, Stack } from '@mantine/core';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const models = [{ value: 'mistral', label: 'Mistral' }];

// Special token detection (optional handling)
const isSpecialToken = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.startsWith('<') && trimmed.endsWith('>');
};

export const ChatScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('mistral');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tokenBuffer = useRef<string>(''); // incoming token batch
  const assistantContent = useRef<string>(''); // full assistant text
  const flushTimer = useRef<NodeJS.Timeout | null>(null); // timer
  const scrollRef = useRef<HTMLDivElement>(null); // for auto-scroll

  const sendPrompt = async () => {
    if (!input.trim()) {
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    const response = await fetch('http://ollama.staging.local/api/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt: input, model: currentModel }),
      headers: { 'Content-Type': 'application/json' },
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    if (reader) {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      assistantContent.current = '';
      startFlushTimer();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          stopFlushTimer();
          flushTokenBuffer(); // Final flush
          break;
        }

        if (value) {
          const textChunk = decoder.decode(value, { stream: true });
          buffer += textChunk;

          let lineEndIndex: number;
          while ((lineEndIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, lineEndIndex);
            buffer = buffer.slice(lineEndIndex + 1);

            const trimmedLine = line.trim();
            if (trimmedLine === '') {
              continue;
            }

            if (!(trimmedLine.startsWith('{') && trimmedLine.endsWith('}'))) {
              console.error(
                'Invalid JSON line (missing curly braces), stopping:',
                trimmedLine
              );
              stopFlushTimer();
              setIsLoading(false);
              return;
            }

            try {
              const parsed = JSON.parse(trimmedLine);
              const chunkText: string = parsed.response || '';

              if (chunkText) {
                if (isSpecialToken(chunkText)) {
                  console.log('Detected special token:', chunkText);
                  continue;
                }
                tokenBuffer.current += chunkText;
              }
            } catch (err) {
              console.error(
                'Failed to parse chunk:',
                err,
                'Line:',
                trimmedLine
              );
              stopFlushTimer();
              setIsLoading(false);
              return;
            }
          }
        }
      }
    }

    setIsLoading(false);
  };

  const startFlushTimer = () => {
    if (flushTimer.current) {
      return;
    }
    flushTimer.current = setInterval(() => {
      flushTokenBuffer();
    }, 200);
  };

  const stopFlushTimer = () => {
    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }
  };

  const flushTokenBuffer = () => {
    const bufferContent = tokenBuffer.current;
    if (bufferContent.length === 0) {
      return;
    }

    tokenBuffer.current = '';
    assistantContent.current += bufferContent;

    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        last.content = assistantContent.current;
      }
      return updated;
    });

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 0);
  };

  return (
    <Stack gap="md" p="md">
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
