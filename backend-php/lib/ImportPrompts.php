<?php

/** Prompts para el import con IA, portados 1:1 desde import_service/prompts.py. */
class ImportPrompts
{
    public static function get(string $entity, string $content): string
    {
        $maxChars = $entity === 'price_list' ? 20000 : 6000;
        if (mb_strlen($content) > $maxChars) {
            $content = mb_substr($content, 0, $maxChars) . "\n... [contenido truncado]";
        }

        $template = match ($entity) {
            'wines' => self::WINES,
            'members' => self::MEMBERS,
            'memberships' => self::MEMBERSHIPS,
            'shipments' => self::SHIPMENTS,
            'price_list' => self::PRICE_LIST,
            'order' => self::ORDER,
            default => throw new BusinessException("Entity de import desconocida: $entity"),
        };

        return str_replace('{content}', $content, $template);
    }

    private const WINES = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON array y nada más.

Extrae los vinos de la siguiente lista de precios y devuelve este JSON array exacto:

[
  {"name": "marca + varietal", "grape": "solo la cepa", "vintageYear": 2022, "referencePrice": 15000, "stockGondola": 0, "stockCuartito": 0, "isClubEligible": false, "uploadStatus": "PENDING"},
  ...
]

Reglas:
- name: marca + varietal combinados (ej: "Achaval Malbec", "Norton Chardonnay")
- grape: solo la cepa (ej: "Malbec", "Chardonnay", "Blend")
- vintageYear: número entero del año, o null si no figura
- referencePrice: precio entero en ARS sin $ ni puntos. Si es por caja de 6 dividir por 6.
- Ignorar headers, contactos, totales, notas.

LISTA DE PRECIOS:
{content}

RESPUESTA (solo el JSON array):
PROMPT;

    private const MEMBERS = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con JSON válido. NO escribas código. NO expliques. SOLO el JSON.

Extrae los miembros del siguiente archivo y devuelve exactamente este formato:

{"members": [{"name": "Nombre Apellido", "email": "mail@ejemplo.com", "phone": "1234567890", "address": "Dirección o null", "tasteProfile": null, "notes": null}], "memberships": [{"memberName": "Nombre Apellido", "plan": "BROTE", "startDate": "2024-01-01", "isActive": true}]}

Planes válidos: BROTE, BROTE_PLUS, ENVERO, ENVERO_PLUS
Si no hay info de planes, dejar "memberships" como array vacío [].

ARCHIVO:
{content}

RESPUESTA (solo el JSON):
PROMPT;

    private const MEMBERSHIPS = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques. SOLO el JSON array.

Extrae las membresías del siguiente archivo:

[{"memberName": "Nombre", "plan": "BROTE", "startDate": "2024-01-01", "isActive": true}]

Planes válidos: BROTE, BROTE_PLUS, ENVERO, ENVERO_PLUS

ARCHIVO:
{content}

RESPUESTA (solo el JSON array):
PROMPT;

    private const SHIPMENTS = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques. SOLO el JSON array.

Extrae los envíos del siguiente archivo:

[{"memberName": "Nombre", "shippedAt": "2024-01-15", "shippingCost": 1500, "notes": null, "items": [{"wineName": "Nombre vino", "quantity": 2, "unitPrice": 5000}]}]

ARCHIVO:
{content}

RESPUESTA (solo el JSON array):
PROMPT;

    private const PRICE_LIST = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON objeto válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON objeto y nada más.

Analizá la siguiente lista de precios de un distribuidor de vinos y devolvé exactamente este formato:

{"distributor": {"name": "Nombre de la empresa", "phone": "teléfono o null", "email": "mail@empresa.com o null"}, "items": [{"name": "Marca Varietal", "grape": "Cepa", "vintageYear": 2022, "purchasePrice": 15000, "boxPurchasePrice": 90000, "recommendedSalePrice": 22000, "imageUrl": null}]}

Reglas:
- distributor.name: buscá el nombre de la empresa en el encabezado, membrete o pie del documento. Si no aparece, usá "Distribuidor Desconocido".
- distributor.phone: número de teléfono de la empresa, o null si no figura.
- distributor.email: email de la empresa, o null si no figura.
- items[].name: marca + varietal combinados (ej: "Achaval Malbec", "Norton Chardonnay").
- items[].grape: solo la cepa principal (ej: "Malbec", "Chardonnay", "Blend").
- items[].vintageYear: número entero del año de cosecha, o null si no figura.
- items[].purchasePrice: precio unitario de compra entero en ARS sin $ ni puntos. Usalo solo si aparece como precio unitario, botella, unidad, costo unitario o si la tabla indica claramente que los precios son por unidad. Si el unico precio visible es por caja y no hay unitario explicito, devolver null.
- items[].boxPurchasePrice: precio de compra por caja entera en ARS sin $ ni puntos. Usalo solo si aparece explicitamente como caja, pack, bulto, x6, caja x 6, precio caja o similar. Si no esta escrito el precio por caja en el documento, devolver null. No lo calcules multiplicando el unitario.
- items[].recommendedSalePrice: precio recomendado de venta al publico entero en ARS sin $ ni puntos. Solo si aparece explicitamente como PVP, precio sugerido, recomendado, venta o similar. Si no aparece, null.
- items[].imageUrl: si hay una URL literal de imagen en el documento, usala. Si el contenido incluye IMAGENES_CANDIDATAS_PARA_IMAGE_URL, usa una de esas URLs solo cuando puedas asociarla claramente con ese vino por cercania visual, etiqueta o layout. Si no estas seguro, devolve null. Nunca inventes URLs.
- Revisa todas las columnas visibles del PDF/imagen, aunque el texto extraido venga desordenado. Si un precio, cosecha, cepa o nombre esta visible en la tabla o etiqueta, extraelo.
- No omitas vinos visibles. Si una fila tiene nombre visible pero algun dato no se puede leer, incluye el vino y deja ese dato en null.
- Para cualquier otro atributo que no exista o no se pueda inferir con seguridad, devolver null. No inventes datos.
- Ignorar filas de totales, subtotales, headers de columnas y notas al pie.

LISTA DE PRECIOS:
{content}

RESPUESTA (solo el JSON objeto):
PROMPT;

    private const ORDER = <<<'PROMPT'
INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON objeto válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON objeto y nada más.

Analizá el siguiente documento (puede ser una lista de pedido, un mensaje de texto, una imagen de whatsapp, un CSV o cualquier formato) y extraé los vinos/productos a pedir con sus cantidades.

Devolvé exactamente este formato:

{"distributor": {"name": "Nombre de la empresa o proveedor", "phone": "teléfono o null", "email": "mail o null"}, "items": [{"name": "Nombre del producto", "grape": "Cepa o null", "vintageYear": 2022, "purchasePrice": null, "quantity": 1}]}

Reglas:
- distributor.name: buscá el nombre del proveedor/empresa en el documento. Si no aparece, usá "Desconocido".
- items[].name: nombre del producto tal como aparece.
- items[].grape: cepa si se puede determinar, o null.
- items[].vintageYear: año de cosecha si figura, o null.
- items[].purchasePrice: precio si figura, o null.
- items[].quantity: cantidad solicitada si figura, o 1 por defecto.

DOCUMENTO:
{content}

RESPUESTA (solo el JSON objeto):
PROMPT;
}
