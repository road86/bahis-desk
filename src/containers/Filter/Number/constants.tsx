// Filter Options
// Greater than option
export const GREATER_THAN_TYPE = 'greater_than';
export const GREATER_THAN_LABEL = '>';

// Greater than or equal option
export const GREATER_THAN_EQUAL_TYPE = 'greater_than_equal';
export const GREATER_THAN_EQUAL_LABEL = '>=';

// Less than option
export const LESS_THAN_TYPE = 'less_than';
export const LESS_THAN_LABEL = '<';

// Greater than or equal option
export const LESS_THAN_EQUAL_TYPE = 'less_than_equal';
export const LESS_THAN_EQUAL_LABEL = '<=';

// Equal option
export const EQUAL_TYPE = 'equals';
export const EQUAL_LABEL = '=';

// Not Equal option
export const NOT_EQUAL_TYPE = 'not_equals';
export const NOT_EQUAL_LABEL = '!=';

// In Between option
export const IN_BETWEEN_TYPE = 'in_between';
export const IN_BETWEEN_LABEL = 'in between';

// text filter operators
export const NUMBER_FILTER_OPERATORS = [
  {
    label: GREATER_THAN_LABEL,
    value: GREATER_THAN_TYPE,
  },
  {
    label: GREATER_THAN_EQUAL_LABEL,
    value: GREATER_THAN_EQUAL_TYPE,
  },
  {
    label: LESS_THAN_LABEL,
    value: LESS_THAN_TYPE,
  },
  {
    label: LESS_THAN_EQUAL_LABEL,
    value: LESS_THAN_EQUAL_TYPE,
  },
  {
    label: EQUAL_LABEL,
    value: EQUAL_TYPE,
  },
  {
    label: NOT_EQUAL_LABEL,
    value: NOT_EQUAL_TYPE,
  },
  {
    label: IN_BETWEEN_LABEL,
    value: IN_BETWEEN_TYPE,
  },
];
