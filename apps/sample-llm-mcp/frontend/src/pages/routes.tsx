/* eslint-disable react-refresh/only-export-components */
import React from 'react';

import { useTranslation } from 'react-i18next';

import { AppRoutes, PageType } from '@/features/router/types';

const HomePage = React.lazy(() =>
  import(/* webpackChunkName: "HomePage" */ './Home/Home').then(module => ({
    default: module.HomePage,
  }))
);

const UserPage = React.lazy(() =>
  import(/* webpackChunkName: "UserPage" */ './User/User').then(module => ({
    default: module.UserPage,
  }))
);

// ADD YOUR PAGE IMPORTS HERE

const OllamaChat = React.lazy(() =>
  import(/* webpackChunkName: "OllamaChat" */ './OllamaChat/OllamaChat').then(
    module => ({
      default: module.OllamaChat,
    })
  )
);

const OllamaMCPChat = React.lazy(() =>
  import(
    /* webpackChunkName: "OllamaMCPChat" */ './OllamaMCPChat/OllamaMCPChat'
  ).then(module => ({
    default: module.OllamaMCPChat,
  }))
);

export const routes = () => {
  const { t } = useTranslation('Menu');

  // if you do not have control/access on hosting(html server) config, use hashRouter
  // keep in mind that if you do not use hashRouter,
  // you should redirect all requests to index.html in your server config

  // ADD YOUR PAGE ROUTES HERE

  // OllamaChat Route
  const OllamaChatRoute: PageType = {
    path: 'ollama-chat',
    element: <OllamaChat />,
    menuLabel: t('Ollama Chat', { ns: 'Menu' }),
    isShownInMainMenu: true,
    isShownInSecondaryMenu: true,
    isProtected: false,
  };

  // OllamaMCPChat Route
  const OllamaMCPChatRoute: PageType = {
    path: 'ollama-mcp-chat',
    element: <OllamaMCPChat />,
    menuLabel: t('Ollama MCP Chat', { ns: 'Menu' }),
    isShownInMainMenu: true,
    isShownInSecondaryMenu: false,
    isProtected: false,
  };

  // do not forget add your page routes into this array
  const PageRoutes: PageType[] = [OllamaChatRoute, OllamaMCPChatRoute];

  // Special Routes
  const HomeRoute: PageType = {
    index: true,
    element: <HomePage />,
    menuLabel: t('Home', { ns: 'Menu' }),
    isShownInMainMenu: true,
    isShownInSecondaryMenu: true,
    isProtected: false,
  };

  // User Dashboard Page
  const UserRoute: PageType = {
    path: 'user',
    element: <UserPage />,
    menuLabel: t('Dashboard', { ns: 'Menu' }),
    isProtected: true,
  };

  return {
    homeRoute: HomeRoute,
    userRoute: UserRoute,
    pageRoutes: PageRoutes,
  } as AppRoutes;
};
