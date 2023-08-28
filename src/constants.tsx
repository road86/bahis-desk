// FIXME these almost certainly don't need to be here like this
// internal urls
export const LOGIN_URL = '/login';
export type LOGIN_URL = typeof LOGIN_URL;
export const LOGOUT_URL = '/logout';
export type LOGOUT_URL = typeof LOGOUT_URL;
export const HOME_URL = '/';
export type HOME_URL = typeof HOME_URL;
export const CLIENT_URL = '/clients';
export type CLIENT_URL = typeof CLIENT_URL;

// TODO what actually is this?
export const FILTER_CHOICES = {
    sample_select_one: [{ name: 'Dhaka' }, { name: 'Chatrogram' }],
    sample_select_one_v1: [
        { name: 'Dhaka', sample_select_one: 'Dhaka' },
        { name: 'Chatrogram', sample_select_one: 'Chatrogram' },
    ],
    sample_select_multiple: [{ name: 'Dhaka' }, { name: 'Chatrogram' }],
    sample_select_multiple_v1: [
        { name: 'Dhaka', sample_select_multiple: 'Dhaka' },
        { name: 'Chatrogram', sample_select_multiple: 'Chatrogram' },
    ],
};
export type FILTER_CHOICES = typeof FILTER_CHOICES;
