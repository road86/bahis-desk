// internal urls
export const LOGIN_URL = '/login';
export type LOGIN_URL = typeof LOGIN_URL;
export const LOGOUT_URL = '/logout';
export type LOGOUT_URL = typeof LOGOUT_URL;
export const HOME_URL = '/';
export type HOME_URL = typeof HOME_URL;
export const CLIENT_URL = '/clients';
export type CLIENT_URL = typeof CLIENT_URL;

/* tslint:disable */
export const DEMO_FORM_JSON = {
  children: [
    {
      children: [
        {
          type: 'form',
          name: 'inside-ai-form',
          label: {
            english: 'inside-ai-form',
            bangla: 'inside-ai-form',
          },
          form_id: 2,
          img_id: 5,
        },
        {
          type: 'list',
          name: 'inside-ai-list',
          label: {
            english: 'inside-ai-list',
            bangla: 'inside-ai-list',
          },
          list_id: 2,
          img_id: 6,
        },
      ],
      type: 'container',
      name: 'inside-ai',
      label: {
        english: 'inside-ai',
        bangla: 'inside-ai',
      },
      img_id: 2,
    },
    {
      type: 'form',
      name: 'ai-form',
      label: {
        english: 'ai-form',
        bangla: 'ai-form',
      },
      form_id: 1,
      img_id: 3,
    },
    {
      type: 'list',
      name: 'ai-list',
      label: {
        english: 'ai-list',
        bangla: 'ai-list',
      },
      list_id: 1,
      img_id: 4,
    },
  ],
  type: 'container',
  name: 'main-menu',
  label: {
    english: 'ai',
    bangla: 'ai',
  },
  img_id: 1,
};
