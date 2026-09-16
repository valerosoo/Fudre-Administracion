<?php

/**
 * Cliente HTTP para la API de Tiendanube v1. Cualquier error de red o respuesta
 * 4xx/5xx lanza una excepción (RuntimeException) que el caller debe capturar
 * (patrón "local primero, Tiendanube best-effort", ver services).
 */
class TiendanubeClient
{
    private static function baseUrl(): string
    {
        return 'https://api.tiendanube.com/v1/' . TIENDANUBE_STORE_ID;
    }

    private static function request(string $method, string $path, ?array $body = null): array
    {
        $ch = curl_init(self::baseUrl() . $path);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authentication: bearer ' . TIENDANUBE_ACCESS_TOKEN,
                'User-Agent: ' . TIENDANUBE_USER_AGENT,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 15,
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        }

        $responseBody = curl_exec($ch);
        if ($responseBody === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException("Error de red llamando a Tiendanube: $error");
        }
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status >= 400) {
            throw new RuntimeException("Tiendanube respondió $status: $responseBody");
        }

        $decoded = $responseBody !== '' ? json_decode($responseBody, true) : [];
        return is_array($decoded) ? $decoded : [];
    }

    /** @return array{0: string, 1: string} [productId, variantId] */
    public static function createProduct(string $name, ?float $price, int $stock): array
    {
        $response = self::request('POST', '/products', [
            'name' => ['es' => $name],
            'variants' => [
                ['price' => self::priceString($price), 'stock' => $stock],
            ],
        ]);

        $productId = (string)($response['id'] ?? '');
        $variants = $response['variants'] ?? [];
        $variantId = isset($variants[0]['id']) ? (string)$variants[0]['id'] : $productId;

        return [$productId, $variantId];
    }

    public static function updateProduct(string $productId, string $variantId, string $name, ?float $price, int $stock): void
    {
        self::request('PUT', "/products/$productId", ['name' => ['es' => $name]]);
        self::request('PUT', "/products/$productId/variants/$variantId", [
            'price' => self::priceString($price),
            'stock' => $stock,
        ]);
    }

    public static function updateStock(string $productId, string $variantId, int $newStock): void
    {
        self::request('PUT', "/products/$productId/variants/$variantId", ['stock' => $newStock]);
    }

    public static function deleteProduct(string $productId): void
    {
        self::request('DELETE', "/products/$productId");
    }

    public static function uploadProductImage(string $productId, string $imageUrl): void
    {
        self::request('POST', "/products/$productId/images", ['src' => $imageUrl]);
    }

    public static function getOrder(string $orderId): array
    {
        return self::request('GET', "/orders/$orderId");
    }

    public static function getCustomer(string $customerId): array
    {
        return self::request('GET', "/customers/$customerId");
    }

    private static function priceString(?float $price): string
    {
        return $price !== null ? number_format($price, 2, '.', '') : '0';
    }
}
