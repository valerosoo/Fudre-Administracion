-- Schema consolidado para el backend PHP de Fudre-Administracion.
-- Correr UNA sola vez (import via phpMyAdmin) en una base de datos MySQL nueva o vacía.
-- Si ya existe la base de datos usada por el backend Java, NO hace falta correr esto:
-- alcanza con crear la tabla nueva `admin_sessions` (ver al final del archivo).

CREATE TABLE IF NOT EXISTS members (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100) NOT NULL DEFAULT 'Sin Nombre',
    email               VARCHAR(150) NOT NULL UNIQUE,
    phone               VARCHAR(30),
    delivery_address    TEXT,
    wine_style          ENUM('JOVENES', 'MAS_CUERPO'),
    wine_types          VARCHAR(100),
    open_to_new         BOOLEAN,
    occasions           VARCHAR(150),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    knowledge           VARCHAR(100),
    frequency           VARCHAR(100),
    budget              VARCHAR(100),
    survey_completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS member_grape_ratings (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    grape     VARCHAR(50) NOT NULL,
    rating    TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS memberships (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id  BIGINT NOT NULL,
    plan       ENUM('BROTE', 'BROTE_PLUS', 'ENVERO', 'ENVERO_PLUS') NOT NULL,
    status     ENUM('ACTIVE', 'PAUSED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    start_date DATE NOT NULL,
    end_date   DATE,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS wines (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                  VARCHAR(150) NOT NULL,
    grape                 VARCHAR(100),
    vintage_year          INT,
    stock_gondola         INT NOT NULL DEFAULT 0,
    stock_cuartito        INT NOT NULL DEFAULT 0,
    reference_price       DECIMAL(10, 2),
    category              ENUM('BROTE', 'ENVERO') GENERATED ALWAYS AS (
                              IF(reference_price IS NULL, NULL,
                                 IF(reference_price < 22500, 'BROTE', 'ENVERO'))
                          ) STORED,
    is_club_eligible      BOOLEAN NOT NULL DEFAULT FALSE,
    tiendanube_product_id VARCHAR(50),
    upload_status         VARCHAR(30),
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    tiendanube_variant_id VARCHAR(50),
    image_url             VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS wine_pool (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan      ENUM('BROTE', 'BROTE_PLUS', 'ENVERO', 'ENVERO_PLUS') NOT NULL,
    wine_id   BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);

CREATE TABLE IF NOT EXISTS shipments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    membership_id       BIGINT NOT NULL,
    member_id           BIGINT NOT NULL,
    shipped_at          DATE NOT NULL,
    shipping_cost       DECIMAL(10, 2),
    notes               TEXT,
    tiendanube_order_id VARCHAR(50),
    type                ENUM('MEMBERSHIP', 'STANDALONE') NOT NULL DEFAULT 'STANDALONE',
    status              ENUM('PROPOSED', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    FOREIGN KEY (membership_id) REFERENCES memberships(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);
CREATE UNIQUE INDEX idx_shipments_tiendanube_order_id ON shipments(tiendanube_order_id);

CREATE TABLE IF NOT EXISTS shipment_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    wine_id     BIGINT NOT NULL,
    quantity    INT NOT NULL DEFAULT 1,
    unit_price  DECIMAL(10, 2),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id),
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);

CREATE TABLE IF NOT EXISTS distributors (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    phone      VARCHAR(50),
    email      VARCHAR(150),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_distributor_name (name)
);

CREATE TABLE IF NOT EXISTS price_list_items (
    id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    distributor_id         BIGINT NOT NULL,
    name                   VARCHAR(150) NOT NULL,
    grape                  VARCHAR(100),
    vintage_year           INT,
    purchase_price         DECIMAL(10,2),
    image_url              VARCHAR(500),
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    box_purchase_price     DECIMAL(10,2) NULL,
    recommended_sale_price DECIMAL(10,2) NULL,
    INDEX idx_pli_distributor (distributor_id),
    INDEX idx_pli_name (name),
    FOREIGN KEY (distributor_id) REFERENCES distributors(id)
);

CREATE TABLE IF NOT EXISTS purchase_list_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    price_list_item_id  BIGINT NOT NULL,
    quantity            INT NOT NULL DEFAULT 1,
    added_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_purch_pli (price_list_item_id),
    FOREIGN KEY (price_list_item_id) REFERENCES price_list_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_date   DATE NOT NULL,
    status       ENUM('PENDING','ORDERED','CANCELLED','DELIVERED') NOT NULL DEFAULT 'PENDING',
    notes        VARCHAR(500),
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATE NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id           BIGINT NOT NULL,
    price_list_item_id BIGINT,
    distributor_id     BIGINT,
    distributor_name   VARCHAR(150) NOT NULL,
    distributor_phone  VARCHAR(50),
    distributor_email  VARCHAR(150),
    name               VARCHAR(150) NOT NULL,
    grape              VARCHAR(100),
    vintage_year       INT,
    purchase_price     DECIMAL(10,2),
    quantity           INT NOT NULL DEFAULT 1,
    item_status        VARCHAR(50) NOT NULL DEFAULT 'ORDERED',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (price_list_item_id) REFERENCES price_list_items(id) ON DELETE SET NULL,
    FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wine_ratings (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    wine_id   BIGINT NOT NULL,
    rating    TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    notes     TEXT,
    rated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_member_wine (member_id, wine_id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (wine_id) REFERENCES wines(id)
);

-- Nueva: sesiones del panel de administración (login single-user)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    token      VARCHAR(64) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);
