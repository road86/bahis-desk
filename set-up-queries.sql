CREATE TABLE users( user_id INTEGER PRIMARY KEY, username TEXT NOT NULL, pass TEXT NOT NULL);
CREATE TABLE app( app_id INTEGER PRIMARY KEY, app_name TEXT NOT NULL, definition TEXT NOT NULL);
CREATE TABLE forms( form_id INTEGER PRIMARY KEY, form_name TEXT NOT NULL, definition TEXT NOT NULL, choice_definition TEXT);
CREATE TABLE lists( list_id INTEGER PRIMARY KEY, list_name TEXT NOT NULL, list_header TEXT, datasource TEXT, filter_definition TEXT, column_definition TEXT);
CREATE TABLE data( data_id INTEGER PRIMARY KEY, form_id INTEGER NOT NULL, data TEXT NOT NULL);