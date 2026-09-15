<?php

/**
 * Prepara el input (texto + adjuntos) para mandarle a Claude, según el tipo de
 * archivo subido. Simplificación deliberada respecto al import_service Python
 * original (ver plan): los PDF se mandan enteros como documento a Claude (que
 * los lee nativamente) en vez de pre-extraer texto/tablas/imágenes con
 * pdfplumber/PyMuPDF; los .xlsx se leen con un parser nativo minimalista
 * (ZipArchive + SimpleXML, sin dependencias externas). No se soporta .xls
 * binario legado (pedirle al usuario exportar a .xlsx o .csv).
 */
class ImportExtractor
{
    /** @return array{content: string, attachments: array[]} */
    public static function build(string $bytes, string $filename): array
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if ($ext === 'pdf') {
            return [
                'content' => '',
                'attachments' => [[
                    'type' => 'document',
                    'media_type' => 'application/pdf',
                    'data' => base64_encode($bytes),
                    'label' => 'PDF adjunto. Analizalo visualmente y como documento.',
                ]],
            ];
        }

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            $mime = self::imageMime($ext);
            $url = self::savePublicImage($bytes, ".$ext");
            return [
                'content' => "Archivo de imagen adjunto. Extrae la lista de precios desde la imagen.\n\n" . self::imageCandidatesBlock([$url]),
                'attachments' => [[
                    'type' => 'image',
                    'media_type' => $mime,
                    'data' => base64_encode($bytes),
                    'label' => "Imagen original. Si corresponde, usa esta URL en imageUrl: $url",
                    'url' => $url,
                ]],
            ];
        }

        if ($ext === 'xlsx') {
            return ['content' => self::fromXlsx($bytes), 'attachments' => []];
        }

        if ($ext === 'xls') {
            throw new BusinessException('Formato .xls (Excel antiguo) no soportado. Exportá el archivo como .xlsx o .csv.');
        }

        return ['content' => self::fromCsvOrText($bytes), 'attachments' => []];
    }

    private static function imageMime(string $ext): string
    {
        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'application/octet-stream',
        };
    }

    private static function imageCandidatesBlock(array $urls): string
    {
        $lines = ['IMAGENES_CANDIDATAS_PARA_IMAGE_URL:'];
        foreach ($urls as $i => $url) {
            $lines[] = 'Imagen candidata ' . ($i + 1) . ": $url";
        }
        $lines[] = 'Usa una de estas URLs en imageUrl solo si corresponde claramente al vino extraido.';
        return implode("\n", $lines);
    }

    public static function savePublicImage(string $bytes, string $ext): string
    {
        $dir = UPLOADS_DIR . '/imported';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $filename = bin2hex(random_bytes(16)) . $ext;
        file_put_contents("$dir/$filename", $bytes);
        return rtrim(SERVER_BASE_URL, '/') . '/import-uploads/' . $filename;
    }

    private static function fromCsvOrText(string $bytes): string
    {
        foreach (['UTF-8', 'ISO-8859-1', 'Windows-1252'] as $encoding) {
            $text = @iconv($encoding, 'UTF-8//IGNORE', $bytes);
            if ($text !== false && $text !== '') {
                return $text;
            }
        }
        return mb_convert_encoding($bytes, 'UTF-8', 'UTF-8');
    }

    /** Parser XLSX minimalista sin dependencias: ZipArchive + SimpleXML sobre la primera hoja. */
    private static function fromXlsx(string $bytes): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'xlsx');
        file_put_contents($tmpFile, $bytes);

        $zip = new ZipArchive();
        if ($zip->open($tmpFile) !== true) {
            unlink($tmpFile);
            throw new BusinessException('No se pudo leer el archivo .xlsx (¿está corrupto?)');
        }

        $sharedStrings = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $sharedStrings = self::parseSharedStrings($sharedXml);
        }

        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();
        unlink($tmpFile);

        if ($sheetXml === false) {
            throw new BusinessException('El archivo .xlsx no tiene hojas legibles');
        }

        return self::sheetXmlToText($sheetXml, $sharedStrings);
    }

    private static function parseSharedStrings(string $xml): array
    {
        $doc = new SimpleXMLElement($xml);
        $strings = [];
        foreach ($doc->si as $si) {
            if (isset($si->t)) {
                $strings[] = (string)$si->t;
            } else {
                $text = '';
                foreach ($si->r as $run) {
                    $text .= (string)$run->t;
                }
                $strings[] = $text;
            }
        }
        return $strings;
    }

    private static function sheetXmlToText(string $xml, array $sharedStrings): string
    {
        $doc = new SimpleXMLElement($xml);
        $lines = [];
        foreach ($doc->sheetData->row as $row) {
            $cells = [];
            foreach ($row->c as $cell) {
                $type = (string)($cell['t'] ?? '');
                $value = '';
                if ($type === 's' && isset($cell->v)) {
                    $value = $sharedStrings[(int)$cell->v] ?? '';
                } elseif ($type === 'inlineStr' && isset($cell->is->t)) {
                    $value = (string)$cell->is->t;
                } elseif (isset($cell->v)) {
                    $value = (string)$cell->v;
                }
                $cells[] = $value;
            }
            $lines[] = implode(' | ', $cells);
        }
        return implode("\n", $lines);
    }
}
