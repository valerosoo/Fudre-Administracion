ALTER TABLE price_list_items
    ADD COLUMN box_purchase_price DECIMAL(10,2) NULL AFTER purchase_price,
    ADD COLUMN recommended_sale_price DECIMAL(10,2) NULL AFTER box_purchase_price;
