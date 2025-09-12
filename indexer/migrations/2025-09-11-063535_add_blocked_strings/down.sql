-- Remove blocked column from names table
ALTER TABLE names DROP COLUMN blocked;

-- Remove indexes
DROP INDEX idx_names_blocked;
DROP INDEX idx_blocked_strings_match_type;
DROP INDEX idx_blocked_strings_string;
DROP TABLE blocked_strings;
