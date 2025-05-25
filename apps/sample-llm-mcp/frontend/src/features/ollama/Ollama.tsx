import React from 'react';

const SimpleChatScreen = React.lazy(() =>
  import(
    /* webpackChunkName: "SimpleChatScreen" */ './components/SimpleChatScreen'
  ).then(module => ({
    default: module.SimpleChatScreen,
  }))
);

const McpChatScreen = React.lazy(() =>
  import(
    /* webpackChunkName: "McpChatScreen" */ './components/McpChatScreen'
  ).then(module => ({
    default: module.McpChatScreen,
  }))
);

export interface OllamaProps {
  mode?: 'simple' | 'mcp';
}
export const Ollama: React.FC<OllamaProps> = ({ mode = 'simple' }) => {
  return mode === 'mcp' ? <McpChatScreen /> : <SimpleChatScreen />;
};
