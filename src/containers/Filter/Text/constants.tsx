// Filter Options
// contains option
export const CONTAINS_TYPE = 'contains';
export const CONTAINS_LABEL = 'contains';

// not contains option
export const NOT_CONTAINS_TYPE = 'not_contains';
export const NOT_CONTAINS_LABEL = 'not contains';

// starts with option
export const STARTS_WITH_TYPE = 'starts_with';
export const STARTS_WITH_LABEL = 'starts with';

// ends with option
export const ENDS_WITH_TYPE = 'ends_with';
export const ENDS_WITH_LABEL = 'ends with';

// equals option
export const EQUAL_TYPE = 'equals';
export const EQUAL_LABEL = 'equals';

// not equals option
export const NOT_EQUAL_TYPE = 'not_equals';
export const NOT_EQUAL_LABEL = 'not equals';

// text filter operators
export const TEXT_FILTER_OPERATORS = [
  {
    label: CONTAINS_LABEL,
    value: CONTAINS_TYPE,
  },
  {
    label: NOT_CONTAINS_LABEL,
    value: NOT_CONTAINS_TYPE,
  },
  {
    label: STARTS_WITH_LABEL,
    value: STARTS_WITH_TYPE,
  },
  {
    label: ENDS_WITH_LABEL,
    value: ENDS_WITH_TYPE,
  },
  {
    label: EQUAL_LABEL,
    value: EQUAL_TYPE,
  },
  {
    label: NOT_EQUAL_LABEL,
    value: NOT_EQUAL_TYPE,
  },
];
