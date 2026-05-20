CREATE TABLE members (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL DEFAULT 'Sin Nombre',
    email            VARCHAR(150) NOT NULL UNIQUE,
    phone            VARCHAR(30),
    delivery_address TEXT,
    wine_style       ENUM('JOVENES', 'MAS_CUERPO'),
    wine_types       VARCHAR(100),
    open_to_new      BOOLEAN,
    occasions        VARCHAR(150),
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_grape_ratings (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    grape     VARCHAR(50) NOT NULL,
    rating    TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE memberships (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id  BIGINT NOT NULL,
    plan       ENUM('BROTE', 'BROTE_PLUS', 'EMVERO', 'EMVERO_PLUS') NOT NULL,
    status     ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date   DATE,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE wines (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(150) NOT NULL,
    grape                 VARCHAR(100),
    vintage_year          INT,
    stock_gondola         INT NOT NULL DEFAULT 0,
    stock_cuartito        INT NOT NULL DEFAULT 0,
    reference_price       DECIMAL(10, 2),
    -- categoria calculada: < 22500 = BROTE, >= 22500 = EMVERO
    category              ENUM('BROTE', 'EMVERO') AS (
                              IF(reference_price IS NULL, NULL,
                                 IF(reference_price < 22500, 'BROTE', 'EMVERO'))
                          ) STORED,
    is_club_eligible      BOOLEAN NOT NULL DEFAULT FALSE,
    tiendanube_product_id VARCHAR(50),
    upload_status         VARCHAR(30),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vinos elegibles por plan (el admin asigna cuáles pueden ir en cada plan)
CREATE TABLE wine_pool (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan      ENUM('BROTE', 'BROTE_PLUS', 'EMVERO', 'EMVERO_PLUS') NOT NULL,
    wine_id   BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);

CREATE TABLE shipments (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    membership_id BIGINT NOT NULL,
    member_id     BIGINT NOT NULL,
    shipped_at    DATE NOT NULL,
    shipping_cost DECIMAL(10, 2),
    notes         TEXT,
    FOREIGN KEY (membership_id) REFERENCES memberships(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE shipment_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    wine_id     BIGINT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10, 2),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);
