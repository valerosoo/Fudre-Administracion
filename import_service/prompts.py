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


def get_prompt(entity: str, content: str) -> str:
    prompts = {
        "wines":        WINES_PROMPT,
        "members":      MEMBERS_PROMPT,
        "memberships":  MEMBERSHIPS_PROMPT,
        "shipments":    SHIPMENTS_PROMPT,
    }
    template = prompts.get(entity)
    if not template:
        raise ValueError(f"Entidad desconocida: {entity}")
    # Truncar contenido para no superar límites del modelo
    max_chars = 6000
    if len(content) > max_chars:
        content = content[:max_chars] + "\n... [contenido truncado]"
    return template.format(content=content)
