import io
import pdfplumber


def extract_text(file_bytes: bytes, filename: str) -> str:
    name = filename.lower()

    if name.endswith(".pdf"):
        return _from_pdf(file_bytes)
    elif name.endswith((".xlsx", ".xls")):
        return _from_excel(file_bytes)
    elif name.endswith(".csv"):
        return _from_csv(file_bytes)
    else:
        raise ValueError(f"Formato no soportado: {filename}. Usá PDF, Excel o CSV.")


def _from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            # Intentar extraer tabla primero (más estructurado)
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        clean = [str(c).strip() if c else "" for c in row]
                        line = " | ".join(c for c in clean if c)
                        if line:
                            text_parts.append(line)
            else:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
    return "\n".join(text_parts)


def _from_excel(file_bytes: bytes) -> str:
    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=0)
        return df.to_string(index=False)
    except ImportError:
        raise RuntimeError("Instalá pandas y openpyxl: pip install pandas openpyxl")


def _from_csv(file_bytes: bytes) -> str:
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return file_bytes.decode(enc)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace")
