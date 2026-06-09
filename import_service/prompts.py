"""
Prompts para cada entidad del sistema Fudre.
El AI recibe el texto del archivo y devuelve JSON estructurado.
"""

WINES_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON array y nada más.

Extrae los vinos de la siguiente lista de precios y devuelve este JSON array exacto:

[
  {{"name": "marca + varietal", "grape": "solo la cepa", "vintageYear": 2022, "referencePrice": 15000, "stockGondola": 0, "stockCuartito": 0, "isClubEligible": false, "uploadStatus": "PENDING"}},
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

RESPUESTA (solo el JSON array):"""


MEMBERS_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con JSON válido. NO escribas código. NO expliques. SOLO el JSON.

Extrae los miembros del siguiente archivo y devuelve exactamente este formato:

{{"members": [{{"name": "Nombre Apellido", "email": "mail@ejemplo.com", "phone": "1234567890", "address": "Dirección o null", "tasteProfile": null, "notes": null}}], "memberships": [{{"memberName": "Nombre Apellido", "plan": "BROTE", "startDate": "2024-01-01", "isActive": true}}]}}

Planes válidos: BROTE, BROTE_PLUS, ENVERO, ENVERO_PLUS
Si no hay info de planes, dejar "memberships" como array vacío [].

ARCHIVO:
{content}

RESPUESTA (solo el JSON):"""


MEMBERSHIPS_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques. SOLO el JSON array.

Extrae las membresías del siguiente archivo:

[{{"memberName": "Nombre", "plan": "BROTE", "startDate": "2024-01-01", "isActive": true}}]

Planes válidos: BROTE, BROTE_PLUS, ENVERO, ENVERO_PLUS

ARCHIVO:
{content}

RESPUESTA (solo el JSON array):"""


SHIPMENTS_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON array válido. NO escribas código. NO expliques. SOLO el JSON array.

Extrae los envíos del siguiente archivo:

[{{"memberName": "Nombre", "shippedAt": "2024-01-15", "shippingCost": 1500, "notes": null, "items": [{{"wineName": "Nombre vino", "quantity": 2, "unitPrice": 5000}}]}}]

ARCHIVO:
{content}

RESPUESTA (solo el JSON array):"""


PRICE_LIST_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON objeto válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON objeto y nada más.

Analizá la siguiente lista de precios de un distribuidor de vinos y devolvé exactamente este formato:

{{"distributor": {{"name": "Nombre de la empresa", "phone": "teléfono o null", "email": "mail@empresa.com o null"}}, "items": [{{"name": "Marca Varietal", "grape": "Cepa", "vintageYear": 2022, "purchasePrice": 15000, "imageUrl": null}}]}}

Reglas:
- distributor.name: buscá el nombre de la empresa en el encabezado, membrete o pie del documento. Si no aparece, usá "Distribuidor Desconocido".
- distributor.phone: número de teléfono de la empresa, o null si no figura.
- distributor.email: email de la empresa, o null si no figura.
- items[].name: marca + varietal combinados (ej: "Achaval Malbec", "Norton Chardonnay").
- items[].grape: solo la cepa principal (ej: "Malbec", "Chardonnay", "Blend").
- items[].vintageYear: número entero del año de cosecha, o null si no figura.
- items[].purchasePrice: precio entero en ARS sin $ ni puntos. Si el precio es por caja de 6 botellas, dividir por 6.
- items[].imageUrl: solo si hay una URL literal en el documento (ej: https://...), de lo contrario null.
- Ignorar filas de totales, subtotales, headers de columnas y notas al pie.

LISTA DE PRECIOS:
{content}

RESPUESTA (solo el JSON objeto):"""


ORDER_PROMPT = """INSTRUCCIÓN CRÍTICA: Responde ÚNICAMENTE con un JSON objeto válido. NO escribas código. NO expliques nada. NO uses markdown. SOLO el JSON objeto y nada más.

Analizá el siguiente documento (puede ser una lista de pedido, un mensaje de texto, una imagen de whatsapp, un CSV o cualquier formato) y extraé los vinos/productos a pedir con sus cantidades.

Devolvé exactamente este formato:

{{"distributor": {{"name": "Nombre de la empresa o proveedor", "phone": "teléfono o null", "email": "mail o null"}}, "items": [{{"name": "Nombre del producto", "grape": "Cepa o null", "vintageYear": 2022, "purchasePrice": null, "quantity": 1}}]}}

Reglas:
- distributor.name: buscá el nombre del proveedor/empresa en el documento. Si no aparece, usá "Desconocido".
- items[].name: nombre del producto tal como aparece.
- items[].grape: cepa si se puede determinar, o null.
- items[].vintageYear: año de cosecha si figura, o null.
- items[].purchasePrice: precio si figura, o null.
- items[].quantity: cantidad solicitada si figura, o 1 por defecto.

DOCUMENTO:
{content}

RESPUESTA (solo el JSON objeto):"""


def get_prompt(entity: str, content: str) -> str:
    prompts = {
        "wines":        WINES_PROMPT,
        "members":      MEMBERS_PROMPT,
        "memberships":  MEMBERSHIPS_PROMPT,
        "shipments":    SHIPMENTS_PROMPT,
        "price_list":   PRICE_LIST_PROMPT,
        "order":        ORDER_PROMPT,
    }
    template = prompts.get(entity)
    if not template:
        raise ValueError(f"Entidad desconocida: {entity}")
    # Truncar contenido para no superar límites del modelo
    max_chars = 6000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n... [contenido truncado]"
    return template.format(content=content)
