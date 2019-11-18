/** The reducer name */
export const reducerName = 'menu';

/** Types of Menu Items */
export const FORM_TYPE = 'form';
export type FORM_TYPE = typeof FORM_TYPE;
export const LIST_TYPE = 'list';
export type LIST_TYPE = typeof LIST_TYPE;
export const MODULE_TYPE = 'container';
export type MODULE_TYPE = typeof MODULE_TYPE;

/** interface for multi language label object */
export interface Label {
  [key: string]: string;
}

/** interface for form menu */
export interface FormMenu {
  type: FORM_TYPE;
  name: string;
  label: Label;
  img_id: number;
  form_id: number;
}
