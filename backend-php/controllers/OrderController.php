<?php

class OrderController
{
    public function index(): void
    {
        $rows = Database::get()->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
        Response::json(array_map([$this, 'toDto'], $rows));
    }

    public function createFromPurchaseList(): void
    {
        $db = Database::get();
        $stmt = $db->query(
            'SELECT pli.quantity as qty, i.name, i.grape, i.vintage_year, i.purchase_price, i.id as price_list_item_id,
                    d.id as distributor_id, d.name as distributor_name, d.phone as distributor_phone, d.email as distributor_email
             FROM purchase_list_items pli
             JOIN price_list_items i ON i.id = pli.price_list_item_id
             JOIN distributors d ON d.id = i.distributor_id'
        );
        $cartItems = $stmt->fetchAll();
        if (empty($cartItems)) {
            throw new BusinessException('La lista de compra está vacía');
        }

        $db->beginTransaction();
        try {
            $db->prepare('INSERT INTO orders (order_date, status) VALUES (:date, "PENDING")')
                ->execute(['date' => date('Y-m-d')]);
            $orderId = (int)$db->lastInsertId();

            $insert = $db->prepare(
                'INSERT INTO order_items (order_id, price_list_item_id, distributor_id, distributor_name, distributor_phone, distributor_email, name, grape, vintage_year, purchase_price, quantity)
                 VALUES (:order_id, :pli_id, :dist_id, :dist_name, :dist_phone, :dist_email, :name, :grape, :year, :price, :qty)'
            );
            foreach ($cartItems as $item) {
                $insert->execute([
                    'order_id' => $orderId,
                    'pli_id' => $item['price_list_item_id'],
                    'dist_id' => $item['distributor_id'],
                    'dist_name' => $item['distributor_name'],
                    'dist_phone' => $item['distributor_phone'],
                    'dist_email' => $item['distributor_email'],
                    'name' => $item['name'],
                    'grape' => $item['grape'],
                    'year' => $item['vintage_year'],
                    'price' => $item['purchase_price'],
                    'qty' => $item['qty'],
                ]);
            }
            $db->exec('DELETE FROM purchase_list_items');
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        Response::json($this->toDto($this->findOrder($orderId)), 201);
    }

    public function importOrder(): void
    {
        $body = Request::body();
        $order = $this->importOrderData($body['distributor'] ?? [], $body['items'] ?? []);
        Response::json($order, 201);
    }

    /** Reutilizado por ImportController::confirm() para el entity "order". */
    public function importOrderData(array $distributor, array $items): array
    {
        $distributorName = $distributor['name'] ?? 'Desconocido';

        $db = Database::get();
        $db->prepare('INSERT INTO orders (order_date, status) VALUES (:date, "PENDING")')
            ->execute(['date' => date('Y-m-d')]);
        $orderId = (int)$db->lastInsertId();

        $insert = $db->prepare(
            'INSERT INTO order_items (order_id, distributor_name, distributor_phone, distributor_email, name, grape, vintage_year, purchase_price, quantity)
             VALUES (:order_id, :dist_name, :dist_phone, :dist_email, :name, :grape, :year, :price, :qty)'
        );
        foreach ($items as $item) {
            $qty = (int)($item['quantity'] ?? 0);
            $insert->execute([
                'order_id' => $orderId,
                'dist_name' => $distributorName,
                'dist_phone' => $distributor['phone'] ?? null,
                'dist_email' => $distributor['email'] ?? null,
                'name' => $item['name'] ?? null,
                'grape' => $item['grape'] ?? null,
                'year' => $item['vintageYear'] ?? null,
                'price' => $item['purchasePrice'] ?? null,
                'qty' => $qty > 0 ? $qty : 1,
            ]);
        }

        return $this->toDto($this->findOrder($orderId));
    }

    public function updateStatus(string $id): void
    {
        $orderId = (int)$id;
        $order = $this->findOrder($orderId);
        $body = Request::body();
        $newStatus = $body['status'] ?? $order['status'];

        $db = Database::get();
        if ($newStatus === 'DELIVERED') {
            $db->prepare('UPDATE orders SET status = :status, delivered_at = :delivered_at WHERE id = :id')
                ->execute(['status' => $newStatus, 'delivered_at' => date('Y-m-d'), 'id' => $orderId]);

            $items = $db->prepare("SELECT * FROM order_items WHERE order_id = :id AND (item_status IS NULL OR item_status = 'ORDERED')");
            $items->execute(['id' => $orderId]);
            foreach ($items->fetchAll() as $item) {
                $this->receiveItemIntoStock($item);
            }
        } else {
            $db->prepare('UPDATE orders SET status = :status WHERE id = :id')->execute(['status' => $newStatus, 'id' => $orderId]);
        }

        Response::json($this->toDto($this->findOrder($orderId)));
    }

    private function receiveItemIntoStock(array $item): void
    {
        $db = Database::get();
        $stmt = $db->prepare('SELECT * FROM wines WHERE LOWER(name) = LOWER(:name) LIMIT 1');
        $stmt->execute(['name' => $item['name']]);
        $wine = $stmt->fetch();

        if ($wine === false) {
            $db->prepare(
                'INSERT INTO wines (name, grape, vintage_year, stock_gondola, stock_cuartito, reference_price, is_club_eligible, upload_status)
                 VALUES (:name, :grape, :year, :stock, 0, :price, 0, "PENDING")'
            )->execute([
                'name' => $item['name'],
                'grape' => $item['grape'],
                'year' => $item['vintage_year'],
                'stock' => $item['quantity'],
                'price' => $item['purchase_price'],
            ]);
            $wineId = (int)$db->lastInsertId();
        } else {
            $newGondola = (int)$wine['stock_gondola'] + (int)$item['quantity'];
            $db->prepare('UPDATE wines SET stock_gondola = :g WHERE id = :id')->execute(['g' => $newGondola, 'id' => $wine['id']]);
            $wineId = (int)$wine['id'];
        }

        $stmt = $db->prepare('SELECT * FROM wines WHERE id = :id');
        $stmt->execute(['id' => $wineId]);
        $wine = $stmt->fetch();
        $newStock = (int)$wine['stock_gondola'] + (int)$wine['stock_cuartito'];

        try {
            if (!empty($wine['tiendanube_product_id']) && !empty($wine['tiendanube_variant_id'])) {
                TiendanubeClient::updateStock($wine['tiendanube_product_id'], $wine['tiendanube_variant_id'], $newStock);
            } else {
                [$productId, $variantId] = TiendanubeClient::createProduct(
                    $wine['name'],
                    $wine['reference_price'] !== null ? (float)$wine['reference_price'] : null,
                    $newStock
                );
                $db->prepare('UPDATE wines SET tiendanube_product_id = :pid, tiendanube_variant_id = :vid, upload_status = "UPLOADED" WHERE id = :id')
                    ->execute(['pid' => $productId, 'vid' => $variantId, 'id' => $wineId]);
            }
        } catch (Throwable $e) {
            Logger::warn("No se pudo sincronizar con Tiendanube al recibir pedido (wine $wineId): " . $e->getMessage());
        }
    }

    public function addItem(string $id): void
    {
        $orderId = (int)$id;
        $order = $this->findOrder($orderId);
        if ($order['status'] !== 'PENDING') {
            throw new BusinessException('Solo se pueden agregar ítems a pedidos PENDING');
        }
        $body = Request::body();
        $priceListItemId = (int)($body['priceListItemId'] ?? 0);
        $quantity = (int)($body['quantity'] ?? 1);

        $stmt = Database::get()->prepare(
            'SELECT i.*, d.id as distributor_id, d.name as distributor_name, d.phone as distributor_phone, d.email as distributor_email
             FROM price_list_items i JOIN distributors d ON d.id = i.distributor_id WHERE i.id = :id'
        );
        $stmt->execute(['id' => $priceListItemId]);
        $item = $stmt->fetch();
        if ($item === false) {
            throw new NotFoundException("No se encontró el ítem de lista de precios $priceListItemId");
        }

        Database::get()->prepare(
            'INSERT INTO order_items (order_id, price_list_item_id, distributor_id, distributor_name, distributor_phone, distributor_email, name, grape, vintage_year, purchase_price, quantity)
             VALUES (:order_id, :pli_id, :dist_id, :dist_name, :dist_phone, :dist_email, :name, :grape, :year, :price, :qty)'
        )->execute([
            'order_id' => $orderId,
            'pli_id' => $item['id'],
            'dist_id' => $item['distributor_id'],
            'dist_name' => $item['distributor_name'],
            'dist_phone' => $item['distributor_phone'],
            'dist_email' => $item['distributor_email'],
            'name' => $item['name'],
            'grape' => $item['grape'],
            'year' => $item['vintage_year'],
            'price' => $item['purchase_price'],
            'qty' => $quantity > 0 ? $quantity : 1,
        ]);

        Response::json($this->toDto($this->findOrder($orderId)), 201);
    }

    public function updateItemStatus(string $orderId, string $itemId): void
    {
        $order = $this->findOrder((int)$orderId);
        if ($order['status'] !== 'ORDERED') {
            throw new BusinessException('Solo se puede cambiar el estado de ítems en pedidos confirmados (ORDERED)');
        }
        $body = Request::body();
        $itemStatus = $body['itemStatus'] ?? 'ORDERED';

        Database::get()->prepare('UPDATE order_items SET item_status = :status WHERE id = :id AND order_id = :order_id')
            ->execute(['status' => $itemStatus, 'id' => (int)$itemId, 'order_id' => (int)$orderId]);

        Response::json($this->findItemDto((int)$itemId));
    }

    public function updateItemQty(string $orderId, string $itemId): void
    {
        $order = $this->findOrder((int)$orderId);
        if ($order['status'] !== 'PENDING') {
            throw new BusinessException('Solo se puede editar la cantidad en pedidos PENDING');
        }
        $body = Request::body();
        $quantity = (int)($body['quantity'] ?? 0);

        if ($quantity <= 0) {
            Database::get()->prepare('DELETE FROM order_items WHERE id = :id AND order_id = :order_id')
                ->execute(['id' => (int)$itemId, 'order_id' => (int)$orderId]);
            Response::noContent();
            return;
        }

        Database::get()->prepare('UPDATE order_items SET quantity = :qty WHERE id = :id AND order_id = :order_id')
            ->execute(['qty' => $quantity, 'id' => (int)$itemId, 'order_id' => (int)$orderId]);
        Response::json($this->findItemDto((int)$itemId));
    }

    public function removeItem(string $orderId, string $itemId): void
    {
        $order = $this->findOrder((int)$orderId);
        if ($order['status'] !== 'PENDING') {
            throw new BusinessException('Solo se pueden quitar ítems de pedidos PENDING');
        }
        Database::get()->prepare('DELETE FROM order_items WHERE id = :id AND order_id = :order_id')
            ->execute(['id' => (int)$itemId, 'order_id' => (int)$orderId]);
        Response::noContent();
    }

    public function delete(string $id): void
    {
        $order = $this->findOrder((int)$id);
        if (!in_array($order['status'], ['PENDING', 'CANCELLED'], true)) {
            throw new BusinessException('Solo se pueden borrar pedidos PENDING o CANCELLED');
        }
        Database::get()->prepare('DELETE FROM orders WHERE id = :id')->execute(['id' => (int)$id]);
        Response::noContent();
    }

    private function findOrder(int $id): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM orders WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();
        if ($order === false) {
            throw new NotFoundException("No se encontró el pedido $id");
        }
        return $order;
    }

    private function findItemDto(int $itemId): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM order_items WHERE id = :id');
        $stmt->execute(['id' => $itemId]);
        $item = $stmt->fetch();
        if ($item === false) {
            throw new NotFoundException("No se encontró el ítem $itemId");
        }
        return $this->itemToDto($item);
    }

    private function itemToDto(array $item): array
    {
        $purchasePrice = $item['purchase_price'] !== null ? (float)$item['purchase_price'] : null;
        return [
            'id' => (int)$item['id'],
            'distributorName' => $item['distributor_name'],
            'distributorPhone' => $item['distributor_phone'],
            'distributorEmail' => $item['distributor_email'],
            'name' => $item['name'],
            'grape' => $item['grape'],
            'vintageYear' => $item['vintage_year'] !== null ? (int)$item['vintage_year'] : null,
            'purchasePrice' => $purchasePrice,
            'quantity' => (int)$item['quantity'],
            'subtotal' => $purchasePrice !== null ? $purchasePrice * (int)$item['quantity'] : null,
            'itemStatus' => $item['item_status'],
        ];
    }

    private function toDto(array $order): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM order_items WHERE order_id = :id ORDER BY distributor_name, name');
        $stmt->execute(['id' => $order['id']]);
        $items = $stmt->fetchAll();

        $totalItems = 0;
        $totalAmount = 0.0;
        foreach ($items as $item) {
            if ($item['item_status'] === null || $item['item_status'] === 'ORDERED') {
                $totalItems += (int)$item['quantity'];
                if ($item['purchase_price'] !== null) {
                    $totalAmount += (float)$item['purchase_price'] * (int)$item['quantity'];
                }
            }
        }

        return [
            'id' => (int)$order['id'],
            'orderDate' => $order['order_date'],
            'deliveredAt' => $order['delivered_at'],
            'status' => $order['status'],
            'notes' => $order['notes'],
            'createdAt' => str_replace(' ', 'T', $order['created_at']),
            'items' => array_map([$this, 'itemToDto'], $items),
            'totalItems' => $totalItems,
            'totalAmount' => $totalAmount,
        ];
    }
}
