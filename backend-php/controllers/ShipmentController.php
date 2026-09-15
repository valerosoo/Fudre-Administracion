<?php

class ShipmentController
{
    public function index(): void
    {
        Response::json(array_map([$this, 'toDto'], $this->allRows()));
    }

    public function show(string $id): void
    {
        Response::json($this->toDto($this->findRow((int)$id)));
    }

    public function byMember(string $memberId): void
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE s.member_id = :member_id ORDER BY s.id DESC');
        $stmt->execute(['member_id' => (int)$memberId]);
        Response::json(array_map([$this, 'toDto'], $stmt->fetchAll()));
    }

    public function byType(string $type): void
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE s.type = :type ORDER BY s.id DESC');
        $stmt->execute(['type' => strtoupper($type)]);
        Response::json(array_map([$this, 'toDto'], $stmt->fetchAll()));
    }

    public function create(): void
    {
        Response::json($this->createData(Request::body()), 201);
    }

    /** Reutilizado por ImportController::confirm() para el entity "shipments". */
    public function createData(array $body): array
    {
        $memberId = (int)($body['memberId'] ?? 0);
        $membershipId = (int)($body['membershipId'] ?? 0);
        if (!$memberId || !$membershipId) {
            throw new BusinessException('memberId y membershipId son obligatorios');
        }

        $db = Database::get();
        $type = $body['type'] ?? 'STANDALONE';
        $status = $body['status'] ?? 'CONFIRMED';
        $items = $body['items'] ?? [];

        $db->beginTransaction();
        try {
            $db->prepare(
                'INSERT INTO shipments (membership_id, member_id, shipped_at, shipping_cost, notes, type, status)
                 VALUES (:membership_id, :member_id, :shipped_at, :shipping_cost, :notes, :type, :status)'
            )->execute([
                'membership_id' => $membershipId,
                'member_id' => $memberId,
                'shipped_at' => $body['shippedAt'] ?? date('Y-m-d'),
                'shipping_cost' => $body['shippingCost'] ?? null,
                'notes' => $body['notes'] ?? null,
                'type' => $type,
                'status' => $status,
            ]);
            $shipmentId = (int)$db->lastInsertId();

            foreach ($items as $item) {
                $wineId = (int)($item['wineId'] ?? 0);
                $quantity = (int)($item['quantity'] ?? 1);
                $wine = $this->findWine($wineId);

                if ($status === 'CONFIRMED') {
                    $this->deductAndSync($wine, $quantity);
                }

                $db->prepare(
                    'INSERT INTO shipment_items (shipment_id, wine_id, quantity, unit_price) VALUES (:shipment_id, :wine_id, :quantity, :unit_price)'
                )->execute([
                    'shipment_id' => $shipmentId,
                    'wine_id' => $wineId,
                    'quantity' => $quantity,
                    'unit_price' => $item['unitPrice'] ?? $wine['reference_price'],
                ]);
            }

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        return $this->toDto($this->findRow($shipmentId));
    }

    public function confirm(string $id): void
    {
        $shipmentId = (int)$id;
        $shipment = $this->findRow($shipmentId);
        if ($shipment['status'] !== 'PROPOSED') {
            throw new BusinessException('Solo se pueden confirmar envíos en estado PROPOSED');
        }

        foreach ($this->items($shipmentId) as $item) {
            $wine = $this->findWine((int)$item['wine_id']);
            $this->deductAndSync($wine, (int)$item['quantity']);
        }

        Database::get()->prepare("UPDATE shipments SET status = 'CONFIRMED' WHERE id = :id")->execute(['id' => $shipmentId]);
        Response::json($this->toDto($this->findRow($shipmentId)));
    }

    public function cancel(string $id): void
    {
        $shipmentId = (int)$id;
        $shipment = $this->findRow($shipmentId);

        if ($shipment['status'] === 'CONFIRMED') {
            foreach ($this->items($shipmentId) as $item) {
                $wine = $this->findWine((int)$item['wine_id']);
                $this->restoreAndSync($wine, (int)$item['quantity']);
            }
        }

        Database::get()->prepare("UPDATE shipments SET status = 'CANCELLED' WHERE id = :id")->execute(['id' => $shipmentId]);
        Response::noContent();
    }

    public function delete(string $id): void
    {
        $shipmentId = (int)$id;
        $shipment = $this->findRow($shipmentId);

        if ($shipment['status'] === 'CONFIRMED') {
            foreach ($this->items($shipmentId) as $item) {
                $wine = $this->findWine((int)$item['wine_id']);
                $this->restoreAndSync($wine, (int)$item['quantity']);
            }
        }

        $db = Database::get();
        $db->prepare('DELETE FROM shipment_items WHERE shipment_id = :id')->execute(['id' => $shipmentId]);
        $db->prepare('DELETE FROM shipments WHERE id = :id')->execute(['id' => $shipmentId]);
        Response::noContent();
    }

    public function generateProposals(): void
    {
        $now = new DateTime();
        $year = (int)Request::query('year', 0);
        $month = (int)Request::query('month', 0);
        if ($year === 0) {
            $year = (int)$now->format('Y');
        }
        if ($month === 0) {
            $month = (int)$now->format('n');
        }

        $service = new RecommendationService();
        $ids = $service->generateProposalsForMonth($year, $month);

        $created = array_map(fn($id) => $this->toDto($this->findRow($id)), $ids);
        Response::json($created);
    }

    private function deductAndSync(array $wine, int $quantity): void
    {
        $total = (int)$wine['stock_gondola'] + (int)$wine['stock_cuartito'];
        if ($total < $quantity) {
            throw new BusinessException('Stock insuficiente para el vino: ' . $wine['name']);
        }
        [$newGondola, $newCuartito] = StockHelper::deduct((int)$wine['stock_gondola'], (int)$wine['stock_cuartito'], $quantity);
        Database::get()->prepare('UPDATE wines SET stock_gondola = :g, stock_cuartito = :c WHERE id = :id')
            ->execute(['g' => $newGondola, 'c' => $newCuartito, 'id' => $wine['id']]);
        $wine['stock_gondola'] = $newGondola;
        $wine['stock_cuartito'] = $newCuartito;
        StockHelper::syncToTiendanube($wine);
    }

    private function restoreAndSync(array $wine, int $quantity): void
    {
        $newGondola = StockHelper::restore((int)$wine['stock_gondola'], $quantity);
        Database::get()->prepare('UPDATE wines SET stock_gondola = :g WHERE id = :id')
            ->execute(['g' => $newGondola, 'id' => $wine['id']]);
        $wine['stock_gondola'] = $newGondola;
        StockHelper::syncToTiendanube($wine);
    }

    private function findWine(int $wineId): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM wines WHERE id = :id');
        $stmt->execute(['id' => $wineId]);
        $wine = $stmt->fetch();
        if ($wine === false) {
            throw new NotFoundException("No se encontró el vino $wineId");
        }
        return $wine;
    }

    private function items(int $shipmentId): array
    {
        $stmt = Database::get()->prepare('SELECT * FROM shipment_items WHERE shipment_id = :id');
        $stmt->execute(['id' => $shipmentId]);
        return $stmt->fetchAll();
    }

    private function baseQuery(): string
    {
        return 'SELECT s.*, m.name as member_name, m.email as member_email FROM shipments s JOIN members m ON m.id = s.member_id';
    }

    private function allRows(): array
    {
        return Database::get()->query($this->baseQuery() . ' ORDER BY s.id DESC')->fetchAll();
    }

    private function findRow(int $id): array
    {
        $stmt = Database::get()->prepare($this->baseQuery() . ' WHERE s.id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if ($row === false) {
            throw new NotFoundException("No se encontró el envío $id");
        }
        return $row;
    }

    private function toDto(array $row): array
    {
        $stmt = Database::get()->prepare(
            'SELECT si.*, w.name as wine_name, w.grape as wine_grape FROM shipment_items si
             JOIN wines w ON w.id = si.wine_id WHERE si.shipment_id = :id ORDER BY si.id'
        );
        $stmt->execute(['id' => $row['id']]);
        $items = array_map(fn($item) => [
            'id' => (int)$item['id'],
            'wineId' => (int)$item['wine_id'],
            'wineName' => $item['wine_name'],
            'wineGrape' => $item['wine_grape'],
            'quantity' => (int)$item['quantity'],
            'unitPrice' => $item['unit_price'] !== null ? (float)$item['unit_price'] : null,
        ], $stmt->fetchAll());

        return [
            'id' => (int)$row['id'],
            'memberId' => (int)$row['member_id'],
            'memberName' => $row['member_name'],
            'memberEmail' => $row['member_email'],
            'membershipId' => (int)$row['membership_id'],
            'shippedAt' => $row['shipped_at'],
            'shippingCost' => $row['shipping_cost'] !== null ? (float)$row['shipping_cost'] : null,
            'notes' => $row['notes'],
            'tiendanubeOrderId' => $row['tiendanube_order_id'],
            'type' => $row['type'],
            'status' => $row['status'],
            'items' => $items,
        ];
    }
}
