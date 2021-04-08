import { AppTypeOption } from './AppTypeForm';

// Option Form Question Name
export const APP_TYPE_FORM_NAME = 'app_type';
export type APP_TYPE_FORM_NAME = typeof APP_TYPE_FORM_NAME;

// Form Title Name
export const TYPE_FORM_TITLE = 'Choose App Type';
export type TYPE_FORM_TITLE = typeof TYPE_FORM_TITLE;

// Form Title Name
export const LOCATION_FORM_TITLE = 'Choose Location Type';
export type LOCATION_FORM_TITLE = typeof LOCATION_FORM_TITLE;

// Form Title Name
export const SIGNIN_FORM_TITLE = 'Enter Crendentials';
export type SIGNIN_FORM_TITLE = typeof SIGNIN_FORM_TITLE;

// App type options

/* ULO Lab Option */
const ULO_LAB_NAME = 'ulo_lab';
const ULO_LAB_LABEL = 'ULO Lab';

const ULO_LAB_OPTION: AppTypeOption = {
  label: ULO_LAB_LABEL,
  name: ULO_LAB_NAME,
};

/* ULO Client Option */
const ULO_CLIENT_NAME = 'ulo_client';
const ULO_CLIENT_LABEL = 'ULO Client';

const ULO_CLIENT_OPTION: AppTypeOption = {
  label: ULO_CLIENT_LABEL,
  name: ULO_CLIENT_NAME,
};

export const APP_TYPE_OPTIONS: AppTypeOption[] = [ULO_CLIENT_OPTION, ULO_LAB_OPTION];
