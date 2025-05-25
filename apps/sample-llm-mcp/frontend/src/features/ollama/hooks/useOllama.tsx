import { useState, useRef } from 'react';

import log from 'loglevel';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const useOllama = (url: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('mistral');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tokenBuffer = useRef<string>(''); // incoming token batch
  const assistantContent = useRef<string>(''); // full assistant text
  const flushTimer = useRef<NodeJS.Timeout | null>(null); // timer
  const scrollRef = useRef<HTMLDivElement>(null); // for auto-scroll

  const models = [{ value: 'mistral', label: 'Mistral' }];

  const sendPrompt = async () => {
    if (!input.trim()) {
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    const response = await fetch(url, {
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
              log.error(
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
                  log.info('Detected special token:', chunkText);
                  continue;
                }
                tokenBuffer.current += chunkText;
              }
            } catch (err) {
              log.error('Failed to parse chunk:', err, 'Line:', trimmedLine);
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

  const isSpecialToken = (text: string): boolean => {
    const trimmed = text.trim();
    return trimmed.startsWith('<') && trimmed.endsWith('>');
  };

  return {
    models,
    messages,
    input,
    currentModel,
    isLoading,
    sendPrompt,
    setInput,
    setCurrentModel,
    scrollRef,
    isSpecialToken,
  };
};
