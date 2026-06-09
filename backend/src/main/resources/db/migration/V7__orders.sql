CREATE TABLE orders (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_date  DATE NOT NULL,
    status      ENUM('PENDING','ORDERED','CANCELLED','DELIVERED') NOT NULL DEFAULT 'PENDING',
    notes       VARCHAR(500),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT NOT NULL,
    price_list_item_id  BIGINT,
    distributor_id      BIGINT,
    distributor_name    VARCHAR(150) NOT NULL,
    distributor_phone   VARCHAR(50),
    distributor_email   VARCHAR(150),
    name                VARCHAR(150) NOT NULL,
    grape               VARCHAR(100),
    vintage_year        INT,
    purchase_price      DECIMAL(10,2),
    quantity            INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (price_list_item_id) REFERENCES price_list_items(id) ON DELETE SET NULL,
    FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE SET NULL
);
