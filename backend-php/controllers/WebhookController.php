<?php

/**
 * Réplica fiel de StockSyncService (Java). Siempre responde 200 (incluso ante
 * datos parciales o entidades no encontradas) para que Tiendanube no reintente
 * infinito; solo rechaza con 403 si el secreto no matchea.
 */
class WebhookController
{
    public function handle(): void
    {
        if (Request::query('secret') !== WEBHOOK_SECRET) {
            Response::error('Forbidden', 403);
            return;
        }

        $payload = Request::body();
        $event = $payload['event'] ?? null;

        // Tiendanube manda un payload liviano: {store_id, event, id}. Hay que
        // pedirle el recurso completo a la API con ese id antes de procesarlo.
        $resourceId = isset($payload['id']) ? (string)$payload['id'] : null;

        try {
            switch ($event) {
                case 'order/paid':
                    $order = $payload['order'] ?? ($resourceId !== null ? TiendanubeClient::getOrder($resourceId) : null);
                    $this->handleOrderPaid($order);
                    break;
                case 'order/cancelled':
                    $order = $payload['order'] ?? ($resourceId !== null ? TiendanubeClient::getOrder($resourceId) : null);
                    $this->handleOrderCancelled($order);
                    break;
                case 'customer/created':
                    $customer = $payload['customer'] ?? ($resourceId !== null ? TiendanubeClient::getCustomer($resourceId) : null);
                    $this->handleCustomerCreated($customer);
                    break;
            }
        } catch (Throwable $e) {
            Logger::error('Error procesando webhook Tiendanube (' . $event . '): ' . $e->getMessage());
        }

        Response::json(['status' => 'ok']);
    }

    private function handleOrderPaid(?array $order): void
    {
        if ($order === null) {
            return;
        }
        if (isset($order['products']) && is_array($order['products'])) {
            $this->discountStockFromOrder($order['products']);
        }
        $this->createShipmentFromOrder($order);
    }

    private function discountStockFromOrder(array $products): void
    {
        foreach ($products as $product) {
            $tiendanubeProductId = (string)($product['product_id'] ?? '');
            $quantity = (int)($product['quantity'] ?? 0);
            $wine = $this->findWineByTiendanubeId($tiendanubeProductId);
            if ($wine === null) {
                continue;
            }

            $total = (int)$wine['stock_gondola'] + (int)$wine['stock_cuartito'];
            if ($total < $quantity) {
                continue;
            }

            [$newGondola, $newCuartito] = StockHelper::deduct((int)$wine['stock_gondola'], (int)$wine['stock_cuartito'], $quantity);
            Database::get()->prepare('UPDATE wines SET stock_gondola = :g, stock_cuartito = :c WHERE id = :id')
                ->execute(['g' => $newGondola, 'c' => $newCuartito, 'id' => $wine['id']]);
            $wine['stock_gondola'] = $newGondola;
            $wine['stock_cuartito'] = $newCuartito;
            StockHelper::syncToTiendanube($wine);
        }
    }

    private function createShipmentFromOrder(array $order): void
    {
        $orderId = (string)($order['id'] ?? '');
        if ($orderId === '' || $this->shipmentExistsForOrder($orderId)) {
            return;
        }

        $customer = $order['customer'] ?? null;
        $email = $customer['email'] ?? null;
        if ($email === null) {
            return;
        }

        $member = $this->findMemberByEmail($email);
        if ($member === null) {
            return;
        }
        $membership = $this->findActiveMembership((int)$member['id']);
        if ($membership === null) {
            return;
        }

        $products = $order['products'] ?? [];
        if (empty($products)) {
            return;
        }

        $items = [];
        foreach ($products as $product) {
            $wine = $this->findWineByTiendanubeId((string)($product['product_id'] ?? ''));
            if ($wine === null) {
                continue;
            }
            $unitPrice = null;
            if (isset($product['price']) && is_numeric($product['price'])) {
                $unitPrice = (float)$product['price'];
            }
            $items[] = [
                'wineId' => (int)$wine['id'],
                'quantity' => (int)($product['quantity'] ?? 1),
                'unitPrice' => $unitPrice,
            ];
        }
        if (empty($items)) {
            return;
        }

        $shippingCost = 0.0;
        if (isset($order['shipping_cost_customer']) && is_numeric($order['shipping_cost_customer'])) {
            $shippingCost = (float)$order['shipping_cost_customer'];
        }

        $shippedAt = date('Y-m-d');
        if (isset($order['created_at']) && is_string($order['created_at'])) {
            $candidate = substr($order['created_at'], 0, 10);
            $parsed = DateTime::createFromFormat('Y-m-d', $candidate);
            if ($parsed !== false) {
                $shippedAt = $candidate;
            }
        }

        $db = Database::get();
        $db->prepare(
            'INSERT INTO shipments (membership_id, member_id, shipped_at, shipping_cost, tiendanube_order_id, notes, type, status)
             VALUES (:membership_id, :member_id, :shipped_at, :shipping_cost, :order_id, :notes, "STANDALONE", "CONFIRMED")'
        )->execute([
            'membership_id' => $membership['id'],
            'member_id' => $member['id'],
            'shipped_at' => $shippedAt,
            'shipping_cost' => $shippingCost,
            'order_id' => $orderId,
            'notes' => "Importado desde Tiendanube orden #$orderId",
        ]);
        $shipmentId = (int)$db->lastInsertId();

        $itemStmt = $db->prepare(
            'INSERT INTO shipment_items (shipment_id, wine_id, quantity, unit_price) VALUES (:shipment_id, :wine_id, :quantity, :unit_price)'
        );
        foreach ($items as $item) {
            $itemStmt->execute([
                'shipment_id' => $shipmentId,
                'wine_id' => $item['wineId'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unitPrice'],
            ]);
        }
    }

    private function handleOrderCancelled(?array $order): void
    {
        if ($order === null) {
            return;
        }
        if (isset($order['products']) && is_array($order['products'])) {
            $this->restoreStockFromOrder($order['products']);
        }
        $orderId = (string)($order['id'] ?? '');
        if ($orderId !== '') {
            $this->cancelShipmentFromOrder($orderId);
        }
    }

    private function restoreStockFromOrder(array $products): void
    {
        foreach ($products as $product) {
            $wine = $this->findWineByTiendanubeId((string)($product['product_id'] ?? ''));
            if ($wine === null) {
                continue;
            }
            $quantity = (int)($product['quantity'] ?? 0);
            $newGondola = StockHelper::restore((int)$wine['stock_gondola'], $quantity);
            Database::get()->prepare('UPDATE wines SET stock_gondola = :g WHERE id = :id')
                ->execute(['g' => $newGondola, 'id' => $wine['id']]);
            $wine['stock_gondola'] = $newGondola;
            StockHelper::syncToTiendanube($wine);
        }
    }

    private function cancelShipmentFromOrder(string $orderId): void
    {
        $db = Database::get();
        $stmt = $db->prepare('SELECT * FROM shipments WHERE tiendanube_order_id = :order_id');
        $stmt->execute(['order_id' => $orderId]);
        $shipment = $stmt->fetch();
        if ($shipment === false) {
            return;
        }

        $itemsStmt = $db->prepare('SELECT * FROM shipment_items WHERE shipment_id = :id');
        $itemsStmt->execute(['id' => $shipment['id']]);
        foreach ($itemsStmt->fetchAll() as $item) {
            $wine = $this->findWineById((int)$item['wine_id']);
            if ($wine === null) {
                continue;
            }
            $newGondola = StockHelper::restore((int)$wine['stock_gondola'], (int)$item['quantity']);
            $db->prepare('UPDATE wines SET stock_gondola = :g WHERE id = :id')->execute(['g' => $newGondola, 'id' => $wine['id']]);
            $wine['stock_gondola'] = $newGondola;
            StockHelper::syncToTiendanube($wine);
        }

        $db->prepare('DELETE FROM shipment_items WHERE shipment_id = :id')->execute(['id' => $shipment['id']]);
        $db->prepare('DELETE FROM shipments WHERE id = :id')->execute(['id' => $shipment['id']]);
    }

    private function handleCustomerCreated(?array $customer): void
    {
        if ($customer === null) {
            return;
        }
        $email = $customer['email'] ?? null;
        if ($email === null) {
            return;
        }

        $existing = $this->findMemberByEmail($email);
        if ($existing !== null) {
            return;
        }

        $address = null;
        $defaultAddress = $customer['default_address'] ?? null;
        if (is_array($defaultAddress)) {
            $street = $defaultAddress['address'] ?? null;
            $city = $defaultAddress['city'] ?? null;
            if ($street && $city) {
                $address = "$street, $city";
            } elseif ($street) {
                $address = $street;
            }
        }

        Database::get()->prepare(
            'INSERT INTO members (name, email, phone, delivery_address) VALUES (:name, :email, :phone, :address)'
        )->execute([
            'name' => $customer['name'] ?? 'Sin Nombre',
            'email' => $email,
            'phone' => $customer['phone'] ?? null,
            'address' => $address,
        ]);
    }

    private function shipmentExistsForOrder(string $orderId): bool
    {
        $stmt = Database::get()->prepare('SELECT id FROM shipments WHERE tiendanube_order_id = :order_id');
        $stmt->execute(['order_id' => $orderId]);
        return $stmt->fetch() !== false;
    }

    private function findWineByTiendanubeId(string $tiendanubeProductId): ?array
    {
        if ($tiendanubeProductId === '') {
            return null;
        }
        $stmt = Database::get()->prepare('SELECT * FROM wines WHERE tiendanube_product_id = :id');
        $stmt->execute(['id' => $tiendanubeProductId]);
        $wine = $stmt->fetch();
        return $wine === false ? null : $wine;
    }

    private function findWineById(int $id): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM wines WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $wine = $stmt->fetch();
        return $wine === false ? null : $wine;
    }

    private function findMemberByEmail(string $email): ?array
    {
        $stmt = Database::get()->prepare('SELECT * FROM members WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $member = $stmt->fetch();
        return $member === false ? null : $member;
    }

    private function findActiveMembership(int $memberId): ?array
    {
        $stmt = Database::get()->prepare("SELECT * FROM memberships WHERE member_id = :id AND status = 'ACTIVE' LIMIT 1");
        $stmt->execute(['id' => $memberId]);
        $membership = $stmt->fetch();
        return $membership === false ? null : $membership;
    }
}
