export const queries =
    'CREATE TABLE module (\
    id INTEGER NOT NULL,\
    title TEXT NOT NULL,\
    icon TEXT NULL,\
    description TEXT NULL,\
    form_id INTEGER NULL,\
    external_url TEXT NULL,\
    sort_order INTEGER NOT NULL,\
    list_definition_id INTEGER NULL,\
    parent_module_id INTEGER NULL,\
    module_type_id INTEGER NOT NULL\
)';
