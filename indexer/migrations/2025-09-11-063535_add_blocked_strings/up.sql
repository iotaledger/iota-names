CREATE TABLE blocked_strings (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    blocked_string TEXT NOT NULL UNIQUE,
    match_type TEXT NOT NULL DEFAULT 'substring' CHECK(match_type IN ('full', 'substring'))
);

CREATE INDEX idx_blocked_strings_string ON blocked_strings(blocked_string);
CREATE INDEX idx_blocked_strings_match_type ON blocked_strings(match_type);

-- Add blocked column to names table
ALTER TABLE names ADD COLUMN blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index on blocked column for better query performance
CREATE INDEX idx_names_blocked ON names(blocked);
