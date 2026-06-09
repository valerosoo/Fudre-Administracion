CREATE TABLE wine_ratings (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id  BIGINT NOT NULL,
    wine_id    BIGINT NOT NULL,
    rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    notes      TEXT,
    rated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_member_wine (member_id, wine_id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);
