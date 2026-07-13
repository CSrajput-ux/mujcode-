export function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) return { files: [], fields: {} };

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const source = buffer.toString('latin1');
  const parts = source.split(boundary).slice(1, -1);
  const fields = {};
  const files = [];

  for (const part of parts) {
    const cleaned = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const headerEnd = cleaned.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const rawHeaders = cleaned.slice(0, headerEnd);
    const body = cleaned.slice(headerEnd + 4);
    const disposition = rawHeaders.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || '';
    const name = disposition.match(/name="([^"]+)"/i)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    const type = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || 'application/octet-stream';

    if (!name) continue;

    if (filename) {
      files.push({
        fieldname: name,
        filename,
        contentType: type,
        buffer: Buffer.from(body, 'latin1')
      });
    } else {
      fields[name] = body;
    }
  }

  return { ...fields, files, fields };
}
