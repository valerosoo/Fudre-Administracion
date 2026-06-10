"""
Importa las respuestas de la encuesta de bienvenida desde el Excel
y las guarda en la base de datos para los miembros existentes.
"""
import openpyxl, mysql.connector, re
from datetime import datetime

EXCEL = r'C:\Users\Pasante\Downloads\Encuesta de Bienvenida –  Fudre   (Respuestas) (1).xlsx'
DB    = dict(host='localhost', user='root', password='Argentina2025', database='fudre_admin')

GRAPES = ['Malbec', 'Cabernet Sauvignon', 'Merlot', 'Syrah', 'Pinot Noir',
          'Chardonnay', 'Sauvignon Blanc', 'Cabernet Franc', 'Semillón', 'Torrontés', 'Rosado']
# col indices: 7=Malbec, 8=CS, 9=Merlot, 10=Syrah, 11=PinotNoir,
#              12=Chardonnay, 13=SauvBlanc, 14=CabFranc, 15=Semillon, 16=Torrontes, 19=Rosado
GRAPE_COLS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19]

def normalize_phone(raw):
    if not raw: return None
    return re.sub(r'\D', '', str(raw))

def map_style(val):
    if not val: return None
    v = val.strip().lower()
    if 'cuerpo' in v: return 'MAS_CUERPO'
    if 'j' in v:      return 'JOVENES'
    return None

def map_open(val):
    if not val: return None
    v = val.strip().lower()
    if v.startswith('s'):  return 1
    if v.startswith('n'):  return 0
    return None  # "Depende del estilo" → NULL

wb = openpyxl.load_workbook(EXCEL)
ws = wb.active

conn = mysql.connector.connect(**DB)
cur  = conn.cursor()

# Aplicar V12 si no existe todavía
for col_def in [
    "ADD COLUMN IF NOT EXISTS knowledge VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS frequency VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS budget VARCHAR(100)",
    "ADD COLUMN IF NOT EXISTS survey_completed_at DATETIME",
]:
    try:
        cur.execute(f"ALTER TABLE members {col_def}")
    except Exception:
        pass
conn.commit()

# Cargar miembros por email
cur.execute('SELECT id, email FROM members')
members = {row[1].lower(): row[0] for row in cur.fetchall()}

imported = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[1]:  # fila vacía
        continue
    email = (row[2] or '').strip().lower()
    if email not in members:
        continue

    member_id = members[email]
    phone     = normalize_phone(row[20])
    address   = (row[3] or '').strip() or None
    style     = map_style(row[5])
    types     = (row[6] or '').strip() or None
    open_new  = map_open(row[17])
    occasions = (row[18] or '').strip() or None

    cur.execute("""
        UPDATE members
        SET phone=%s, delivery_address=%s, wine_style=%s, wine_types=%s,
            open_to_new=%s, occasions=%s, survey_completed_at=%s
        WHERE id=%s
    """, (phone, address, style, types, open_new, occasions,
          datetime.now(), member_id))

    # Grape ratings
    cur.execute("DELETE FROM member_grape_ratings WHERE member_id=%s", (member_id,))
    for grape, col_idx in zip(GRAPES, GRAPE_COLS):
        val = row[col_idx]
        if val is not None:
            cur.execute(
                "INSERT INTO member_grape_ratings (member_id, grape, rating) VALUES (%s,%s,%s)",
                (member_id, grape, int(val))
            )

    print(f"  OK: {row[1].strip():<30} estilo={style}  cepas={len([r for r in [row[c] for c in GRAPE_COLS] if r])}")
    imported += 1

conn.commit()
cur.close()
conn.close()
print(f"\n{imported} miembros importados correctamente.")
