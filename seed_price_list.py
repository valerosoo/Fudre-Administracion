"""
Inserta vinos de prueba en la lista de precios via API.
Uso: python seed_price_list.py
"""

import requests

BASE = "http://localhost:8080/api/price-list/upsert"

batches = [
    {
        "distributor": {"name": "Bodegas del Sur", "phone": "011-4523-7890", "email": "ventas@bodegasdelsur.com.ar"},
        "items": [
            {"name": "Catena Zapata Adrianna", "grape": "Malbec",      "vintageYear": 2021, "purchasePrice": 18500, "imageUrl": None},
            {"name": "Luigi Bosca Gala 1",      "grape": "Cabernet",    "vintageYear": 2020, "purchasePrice": 12000, "imageUrl": None},
            {"name": "Zuccardi Valle Puro",      "grape": "Malbec",      "vintageYear": 2022, "purchasePrice": 9800,  "imageUrl": None},
            {"name": "Achaval Ferrer Quimera",   "grape": "Blend",       "vintageYear": 2021, "purchasePrice": 14500, "imageUrl": None},
        ],
    },
    {
        "distributor": {"name": "Vinos & Co.", "phone": "0261-430-1122", "email": "info@vinosyco.com.ar"},
        "items": [
            {"name": "Clos de los Siete",         "grape": "Malbec",      "vintageYear": 2022, "purchasePrice": 8900,  "imageUrl": None},
            {"name": "Renacer Punto Final",        "grape": "Malbec",      "vintageYear": 2023, "purchasePrice": 5200,  "imageUrl": None},
            {"name": "Trapiche Gran Medalla",      "grape": "Cabernet",    "vintageYear": 2020, "purchasePrice": 11000, "imageUrl": None},
        ],
    },
    {
        "distributor": {"name": "Distribuidora Norte", "phone": "0343-555-6677", "email": None},
        "items": [
            {"name": "Rutini Coleccion Malbec",   "grape": "Malbec",      "vintageYear": 2022, "purchasePrice": 7600,  "imageUrl": None},
            {"name": "Clos de los Siete",          "grape": "Malbec",      "vintageYear": 2022, "purchasePrice": 9100,  "imageUrl": None},  # mismo vino, distinta empresa
            {"name": "Alta Vista Terroir",         "grape": "Torrontés",   "vintageYear": 2023, "purchasePrice": 4800,  "imageUrl": None},
        ],
    },
]

total = 0
for batch in batches:
    resp = requests.post(BASE, json=batch)
    if resp.ok:
        count = len(batch["items"])
        total += count
        print(f"✓ {batch['distributor']['name']} — {count} vinos importados")
    else:
        print(f"✗ {batch['distributor']['name']} — Error {resp.status_code}: {resp.text}")

print(f"\nTotal: {total} vinos insertados en {len(batches)} distribuidoras")
print("Nota: 'Clos de los Siete 2022' aparece en Bodegas del Sur Y Distribuidora Norte (prueba de duplicado)")
