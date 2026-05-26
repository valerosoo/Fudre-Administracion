#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv
import re
import requests
import mysql.connector
from datetime import datetime

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Argentina2025',
    'database': 'fudre_admin'
}
BASE_URL = 'http://localhost:8080/api'

MEMBERS_CSV = r"c:\Users\Pasante\Downloads\Encuesta de Bienvenida –  Fudre   (Respuestas)(Respuestas de formulario 1).csv"
WINES_CSV   = r"c:\Users\Pasante\Downloads\Copia de StockOficialFudre(1_10) (1)(Sheet1).csv"

GRAPES = [
    'Malbec', 'Cabernet Sauvignon', 'Merlot', 'Syrah', 'Pinot Noir',
    'Chardonnay', 'Sauvignon Blanc', 'Cabernet Franc', 'Semillón', 'Torrontés'
]

# ── Clear database ────────────────────────────────────────────────────────────

def clear_db():
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SET FOREIGN_KEY_CHECKS=0")
    for table in ['shipment_items', 'shipments', 'wine_pool', 'memberships',
                  'member_grape_ratings', 'members', 'wines']:
        cur.execute(f"TRUNCATE TABLE {table}")
    cur.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    cur.close()
    conn.close()
    print("✓ Base de datos limpiada")

# ── Price extractor ───────────────────────────────────────────────────────────

def extract_price(s):
    if not s or s.strip() in ('--', '-', ''):
        return 0
    # Prefer "unitario" value
    m = re.search(r'\(\$?\s*([\d\s\.]+)\s*unitario\)', s)
    if m:
        return parse_num(m.group(1))
    # Find all $ amounts
    matches = re.findall(r'\$\s*([\d\s\.]+)', s)
    if matches:
        return parse_num(matches[0])
    # Bare number
    m = re.search(r'(\d[\d\s\.]+)', s)
    if m:
        return parse_num(m.group(1))
    return 0

def parse_num(s):
    # In Argentine format, period = thousands separator
    s = re.sub(r'[^\d]', '', s.strip())
    try:
        return int(s)
    except:
        return 0

# ── Plan normalizer ───────────────────────────────────────────────────────────

def normalize_plan(s):
    s = s.strip().lower()
    if 'envero' in s and '+' in s:
        return 'ENVERO_PLUS'
    if 'envero' in s:
        return 'ENVERO'
    if 'brote' in s and '+' in s:
        return 'BROTE_PLUS'
    return 'BROTE'

# ── Taste profile builder ─────────────────────────────────────────────────────

def build_taste_profile(row):
    parts = []
    body = row[5].strip() if len(row) > 5 else ''
    wine_types = row[6].strip() if len(row) > 6 else ''
    if body:
        parts.append(f"Cuerpo: {body}")
    if wine_types:
        parts.append(f"Tipos: {wine_types}")
    grape_parts = []
    for i, grape in enumerate(GRAPES):
        val = row[7 + i].strip() if len(row) > 7 + i else ''
        if val:
            grape_parts.append(f"{grape}: {val}/5")
    if grape_parts:
        parts.append("Cepas — " + ", ".join(grape_parts))
    rosado = row[19].strip() if len(row) > 19 else ''
    if rosado:
        parts.append(f"Rosado: {rosado}/5")
    try_new = row[17].strip() if len(row) > 17 else ''
    if try_new:
        parts.append(f"Probar nuevos: {try_new}")
    occasion = row[18].strip() if len(row) > 18 else ''
    if occasion:
        parts.append(f"Ocasión: {occasion}")
    return ". ".join(parts)

# ── Load members + memberships ────────────────────────────────────────────────

def load_members():
    count = 0
    with open(MEMBERS_CSV, encoding='latin-1', newline='') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)  # skip header
        for row in reader:
            if not row or not row[1].strip():
                continue
            name    = row[1].strip()
            email   = row[2].strip()
            address = row[3].strip() if len(row) > 3 else ''
            plan    = normalize_plan(row[4]) if len(row) > 4 else 'BROTE'
            phone   = row[20].strip() if len(row) > 20 else ''
            taste   = build_taste_profile(row)

            r = requests.post(f"{BASE_URL}/members", json={
                'name': name,
                'email': email,
                'phone': phone or None,
                'address': address,
                'tasteProfile': taste,
                'notes': ''
            })
            r.raise_for_status()
            member = r.json()
            mid = member['id']

            # Parse start date from survey timestamp
            ts = row[0].strip() if row else ''
            try:
                dt = datetime.strptime(ts, '%m/%d/%Y %H:%M:%S')
                start_date = dt.strftime('%Y-%m-%d')
            except:
                start_date = datetime.today().strftime('%Y-%m-%d')

            rm = requests.post(f"{BASE_URL}/memberships", json={
                'memberId': mid,
                'plan': plan,
                'startDate': start_date,
                'isActive': True
            })
            rm.raise_for_status()

            print(f"  ✓ {name} ({plan})")
            count += 1
    print(f"✓ {count} miembros cargados")

# ── Load wines ────────────────────────────────────────────────────────────────

def load_wines():
    ok = 0
    errors = 0
    with open(WINES_CSV, encoding='latin-1', newline='') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader)  # skip header
        for row in reader:
            if not row or not row[0].strip():
                continue
            name  = row[0].strip()
            grape = row[1].strip() if len(row) > 1 else ''

            vintage_raw = row[2].strip() if len(row) > 2 else ''
            try:
                vintage = int(vintage_raw) if vintage_raw else None
            except:
                vintage = None

            def to_int(v):
                v = v.strip() if v else ''
                try:
                    return int(v)
                except:
                    return 0

            stock_gondola  = to_int(row[3]) if len(row) > 3 else 0
            stock_cuartito = to_int(row[4]) if len(row) > 4 else 0
            estado         = row[6].strip() if len(row) > 6 else ''
            precio_raw     = row[7].strip() if len(row) > 7 else ''
            club_raw       = row[9].strip() if len(row) > 9 else ''

            upload_status   = 'UPLOADED' if estado == 'Subido' else 'PENDING'
            ref_price       = extract_price(precio_raw)
            is_club_eligible = club_raw.upper() == 'VERDADERO'

            payload = {
                'name': name,
                'grape': grape,
                'stockGondola': stock_gondola,
                'stockCuartito': stock_cuartito,
                'referencePrice': ref_price,
                'isClubEligible': is_club_eligible,
                'uploadStatus': upload_status,
            }
            if vintage:
                payload['vintageYear'] = vintage

            r = requests.post(f"{BASE_URL}/wines", json=payload)
            if r.status_code in (200, 201):
                ok += 1
            else:
                print(f"  ✗ '{name}': {r.status_code} — {r.text[:80]}")
                errors += 1

    print(f"✓ {ok} vinos cargados, {errors} errores")

# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("── 1. Limpiando base de datos...")
    clear_db()
    print("\n── 2. Cargando miembros y membresías...")
    load_members()
    print("\n── 3. Cargando vinos...")
    load_wines()
    print("\n✅ Listo!")
