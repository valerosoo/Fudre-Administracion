<?php

/**
 * Lógica de descuento/restitución de stock compartida por Shipment, Order y
 * StockSync (webhooks). El caller es responsable de leer/guardar la fila de
 * `wines` en la base de datos y de validar stock suficiente si corresponde.
 */
class StockHelper
{
    /** @return array{0:int,1:int} [nuevoStockGondola, nuevoStockCuartito] descontando gondola primero. */
    public static function deduct(int $stockGondola, int $stockCuartito, int $quantity): array
    {
        $fromGondola = min($quantity, $stockGondola);
        $newGondola = $stockGondola - $fromGondola;
        $remaining = $quantity - $fromGondola;
        $newCuartito = $stockCuartito - $remaining;
        return [$newGondola, $newCuartito];
    }

    /** Restituye siempre a stockGondola (igual que el comportamiento original). */
    public static function restore(int $stockGondola, int $quantity): int
    {
        return $stockGondola + $quantity;
    }

    /** Best-effort: nunca lanza, solo loguea si falla. */
    public static function syncToTiendanube(array $wine): void
    {
        if (empty($wine['tiendanube_product_id']) || empty($wine['tiendanube_variant_id'])) {
            return;
        }
        $total = (int)$wine['stock_gondola'] + (int)$wine['stock_cuartito'];
        try {
            TiendanubeClient::updateStock($wine['tiendanube_product_id'], $wine['tiendanube_variant_id'], $total);
        } catch (Throwable $e) {
            Logger::warn('No se pudo sincronizar stock a Tiendanube (wine ' . $wine['id'] . '): ' . $e->getMessage());
        }
    }
}
