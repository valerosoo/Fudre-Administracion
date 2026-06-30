import base64
import io
import mimetypes
import os
import uuid

import pdfplumber

from config import IMPORT_PUBLIC_URL, IMPORT_UPLOAD_DIR


IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
SUPPORTED_EXTENSIONS = (".pdf", ".xlsx", ".xls", ".csv", *IMAGE_EXTENSIONS)


def build_ai_input(file_bytes: bytes, filename: str) -> dict:
    """
    Prepara texto y adjuntos multimodales para Claude.
    Excel/CSV van como texto. PDF e imagenes tambien se adjuntan para que
    Claude vea layout, tablas escaneadas e imagenes.
    """
    name = filename.lower()
    attachments = []
    image_refs = []

    if name.endswith(".pdf"):
        content = _from_pdf(file_bytes)
        attachments.append(_attachment_from_bytes(
            file_bytes=file_bytes,
            media_type="application/pdf",
            label="PDF original adjunto. Analizalo visualmente y como documento.",
            attachment_type="document",
        ))

        page_images = _render_pdf_pages(file_bytes)
        attachments.extend(page_images)

        extracted_images = _extract_pdf_images(file_bytes)
        attachments.extend(extracted_images)
        image_refs = [a for a in extracted_images if a.get("url")]
    elif name.endswith(IMAGE_EXTENSIONS):
        content = "Archivo de imagen adjunto. Extrae la lista de precios desde la imagen."
        url = _save_public_image(file_bytes, _extension_from_name(filename) or ".jpg")
        attachments.append(_attachment_from_bytes(
            file_bytes=file_bytes,
            media_type=_media_type(filename),
            label=f"Imagen original adjunta. URL publica de referencia: {url}",
            attachment_type="image",
            url=url,
        ))
        image_refs = attachments[:]
    elif name.endswith((".xlsx", ".xls")):
        content = extract_text(file_bytes, filename)
        if name.endswith(".xlsx"):
            extracted_images = _extract_xlsx_images(file_bytes)
            attachments.extend(extracted_images)
            image_refs = [a for a in extracted_images if a.get("url")]
    else:
        content = extract_text(file_bytes, filename)

    if image_refs:
        refs = "\n".join(
            f"- Imagen candidata {idx}: {ref['url']}"
            for idx, ref in enumerate(image_refs, start=1)
        )
        content = (
            f"{content}\n\n"
            "IMAGENES_CANDIDATAS_PARA_IMAGE_URL:\n"
            f"{refs}\n"
            "Usa una de estas URLs en imageUrl solo si corresponde claramente al vino extraido."
        )

    return {"content": content, "attachments": attachments}


def extract_text(file_bytes: bytes, filename: str) -> str:
    name = filename.lower()

    if name.endswith(".pdf"):
        return _from_pdf(file_bytes)
    if name.endswith((".xlsx", ".xls")):
        return _from_excel(file_bytes)
    if name.endswith(".csv"):
        return _from_csv(file_bytes)
    if name.endswith(IMAGE_EXTENSIONS):
        return "Archivo de imagen adjunto."
    raise ValueError(f"Formato no soportado: {filename}. Usa PDF, Excel, CSV o imagen.")


def _from_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            page_parts = []
            tables = page.extract_tables()
            if tables:
                for table in tables:
                    for row in table:
                        clean = [str(c).strip() if c else "" for c in row]
                        line = " | ".join(c for c in clean if c)
                        if line:
                            page_parts.append(line)

            text = page.extract_text(x_tolerance=1, y_tolerance=3, layout=True)
            if text:
                page_parts.append(text)

            if page_parts:
                text_parts.append(f"--- PAGINA {page_index} ---\n" + "\n".join(page_parts))
    return "\n".join(text_parts)


def _from_excel(file_bytes: bytes) -> str:
    try:
        import pandas as pd
    except ImportError:
        raise RuntimeError("Instala pandas y openpyxl: pip install pandas openpyxl")

    df = pd.read_excel(io.BytesIO(file_bytes), sheet_name=0)
    return df.to_string(index=False)


def _from_csv(file_bytes: bytes) -> str:
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return file_bytes.decode(enc)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace")


def _attachment_from_bytes(
    file_bytes: bytes,
    media_type: str,
    label: str,
    attachment_type: str,
    url: str | None = None,
) -> dict:
    attachment = {
        "type": attachment_type,
        "media_type": media_type,
        "data": base64.b64encode(file_bytes).decode("ascii"),
        "label": label,
    }
    if url:
        attachment["url"] = url
    return attachment


def _extract_pdf_images(file_bytes: bytes, max_images: int = 12) -> list[dict]:
    try:
        import fitz
    except ImportError:
        return []

    attachments = []
    seen = set()
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_index in range(len(doc)):
            page = doc[page_index]
            for image_index, img in enumerate(page.get_images(full=True), start=1):
                if len(attachments) >= max_images:
                    return attachments

                xref = img[0]
                if xref in seen:
                    continue
                seen.add(xref)

                extracted = doc.extract_image(xref)
                data = extracted.get("image")
                ext = "." + (extracted.get("ext") or "png").lower()
                if not data or len(data) < 2500:
                    continue

                media_type = mimetypes.types_map.get(ext, "image/png")
                if not media_type.startswith("image/"):
                    continue

                url = _save_public_image(data, ext)
                label = (
                    f"Imagen candidata {len(attachments) + 1} extraida del PDF "
                    f"(pagina {page_index + 1}, imagen {image_index}). "
                    f"Si corresponde a un vino, usa exactamente esta URL: {url}"
                )
                attachments.append(_attachment_from_bytes(
                    file_bytes=data,
                    media_type=media_type,
                    label=label,
                    attachment_type="image",
                    url=url,
                ))
    return attachments


def _render_pdf_pages(file_bytes: bytes, max_pages: int = 6) -> list[dict]:
    try:
        import fitz
    except ImportError:
        return []

    attachments = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_index in range(min(len(doc), max_pages)):
            page = doc[page_index]
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            data = pixmap.tobytes("png")
            label = (
                f"Captura visual de la pagina {page_index + 1} del PDF. "
                "Usala para leer precios, cosechas, cepas, columnas y filas que el texto extraido no haya capturado bien."
            )
            attachments.append(_attachment_from_bytes(
                file_bytes=data,
                media_type="image/png",
                label=label,
                attachment_type="image",
            ))
    return attachments


def _extract_xlsx_images(file_bytes: bytes, max_images: int = 12) -> list[dict]:
    try:
        from openpyxl import load_workbook
    except ImportError:
        return []

    attachments = []
    workbook = load_workbook(io.BytesIO(file_bytes), read_only=False, data_only=True)
    for sheet in workbook.worksheets:
        for image_index, image in enumerate(getattr(sheet, "_images", []), start=1):
            if len(attachments) >= max_images:
                return attachments

            data = image._data()
            if not data or len(data) < 2500:
                continue

            ext = _image_format_to_ext(getattr(image, "format", None))
            media_type = mimetypes.types_map.get(ext, "image/png")
            url = _save_public_image(data, ext)
            row, col = _xlsx_image_position(image)
            label = (
                f"Imagen candidata {len(attachments) + 1} extraida del Excel "
                f"(hoja {sheet.title}, fila {row}, columna {col}). "
                f"Si corresponde a un vino, usa exactamente esta URL: {url}"
            )
            attachments.append(_attachment_from_bytes(
                file_bytes=data,
                media_type=media_type,
                label=label,
                attachment_type="image",
                url=url,
            ))
    return attachments


def _save_public_image(file_bytes: bytes, ext: str) -> str:
    os.makedirs(IMPORT_UPLOAD_DIR, exist_ok=True)
    safe_ext = ext if ext.startswith(".") else f".{ext}"
    filename = f"{uuid.uuid4().hex}{safe_ext}"
    path = os.path.join(IMPORT_UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return f"{IMPORT_PUBLIC_URL.rstrip('/')}/import-uploads/{filename}"


def _extension_from_name(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def _media_type(filename: str) -> str:
    return mimetypes.guess_type(filename)[0] or "image/jpeg"


def _image_format_to_ext(image_format: str | None) -> str:
    value = (image_format or "png").lower()
    if value in ("jpeg", "jpg"):
        return ".jpg"
    if value == "webp":
        return ".webp"
    return ".png"


def _xlsx_image_position(image) -> tuple[int | str, int | str]:
    marker = getattr(getattr(image, "anchor", None), "_from", None)
    if not marker:
        return "?", "?"
    return marker.row + 1, marker.col + 1
