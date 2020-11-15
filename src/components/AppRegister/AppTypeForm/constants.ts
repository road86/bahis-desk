import { AppTypeOption } from '.';

// Form Title Name
export const FORM_TITLE = 'Choose App Type';
export type FORM_TITLE = typeof FORM_TITLE;

// Option Form Question Name
export const APP_TYPE_FORM_NAME = 'app_type';
export type APP_TYPE_FORM_NAME = typeof APP_TYPE_FORM_NAME;

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
