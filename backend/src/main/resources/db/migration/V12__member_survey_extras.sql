ALTER TABLE members
    ADD COLUMN knowledge VARCHAR(100),
    ADD COLUMN frequency VARCHAR(100),
    ADD COLUMN budget    VARCHAR(100),
    ADD COLUMN survey_completed_at DATETIME;
