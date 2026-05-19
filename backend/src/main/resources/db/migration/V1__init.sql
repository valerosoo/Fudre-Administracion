CREATE TABLE members (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    phone       VARCHAR(30),
    taste_notes TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id   BIGINT NOT NULL,
    plan        ENUM('BROTE', 'BROTE_PLUS', 'EMVERO', 'EMVERO_PLUS') NOT NULL,
    status      ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    start_date  DATE NOT NULL,
    end_date    DATE,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Vinos elegibles por plan (ids referencian productos de Tiendanube)
CREATE TABLE wine_pool (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan                  ENUM('BROTE', 'BROTE_PLUS', 'EMVERO', 'EMVERO_PLUS') NOT NULL,
    tiendanube_product_id VARCHAR(50) NOT NULL,
    wine_name             VARCHAR(150) NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE shipments (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    membership_id  BIGINT NOT NULL,
    shipped_at     DATE NOT NULL,
    shipping_cost  DECIMAL(10, 2),
    notes          TEXT,
    FOREIGN KEY (membership_id) REFERENCES memberships(id)
);

CREATE TABLE shipment_items (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id           BIGINT NOT NULL,
    tiendanube_product_id VARCHAR(50) NOT NULL,
    wine_name             VARCHAR(150) NOT NULL,
    quantity              INT NOT NULL DEFAULT 1,
    unit_price            DECIMAL(10, 2),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);
