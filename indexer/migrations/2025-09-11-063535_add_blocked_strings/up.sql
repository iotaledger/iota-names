CREATE TABLE blocked_strings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    blocked_string TEXT NOT NULL UNIQUE
);

CREATE INDEX idx_blocked_strings_string ON blocked_strings(blocked_string);
