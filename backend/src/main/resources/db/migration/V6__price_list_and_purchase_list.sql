CREATE TABLE distributors (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    phone      VARCHAR(50),
    email      VARCHAR(150),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_distributor_name (name)
);

CREATE TABLE price_list_items (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    distributor_id BIGINT NOT NULL,
    name           VARCHAR(150) NOT NULL,
    grape          VARCHAR(100),
    vintage_year   INT,
    purchase_price DECIMAL(10,2),
    image_url      VARCHAR(500),
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pli_distributor (distributor_id),
    INDEX idx_pli_name (name),
    FOREIGN KEY (distributor_id) REFERENCES distributors(id)
);

CREATE TABLE purchase_list_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    price_list_item_id  BIGINT NOT NULL,
    quantity            INT NOT NULL DEFAULT 1,
    added_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purch_pli (price_list_item_id),
    FOREIGN KEY (price_list_item_id) REFERENCES price_list_items(id) ON DELETE CASCADE
);
