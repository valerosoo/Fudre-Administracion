ALTER TABLE shipments ADD COLUMN tiendanube_order_id VARCHAR(50);
CREATE UNIQUE INDEX idx_shipments_tiendanube_order_id ON shipments(tiendanube_order_id);
