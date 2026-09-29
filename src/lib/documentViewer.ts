function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function openBlankViewerTab() {
  return window.open('about:blank', '_blank');
}

export function writeDocumentViewer(
  target: Window,
  options: {
    blobUrl: string;
    fileName: string;
    title: string;
    mimeType?: string | null;
    textContent?: string | null;
    fileType?: string | null;
  }
) {
  const fileName = options.fileName || 'document';
  const title = options.title || fileName;
  const mime = options.mimeType || '';
  const lowerName = fileName.toLowerCase();
  const isPdf = mime === 'application/pdf' || lowerName.endsWith('.pdf');
  const isImage = mime.startsWith('image/');
  const isAudio = mime.startsWith('audio/');
  const isVideo = mime.startsWith('video/');

  let stage = '';
  if (isPdf) {
    stage = `<iframe class="frame" src="${options.blobUrl}" title="${escapeHtml(title)}"></iframe>`;
  } else if (isImage) {
    stage = `<div class="stage"><img src="${options.blobUrl}" alt="${escapeHtml(title)}" /></div>`;
  } else if (options.textContent != null) {
    stage = `<pre class="text-view">${escapeHtml(options.textContent)}</pre>`;
  } else if (isAudio) {
    stage = `<div class="stage media"><audio src="${options.blobUrl}" controls></audio></div>`;
  } else if (isVideo) {
    stage = `<div class="stage media"><video src="${options.blobUrl}" controls></video></div>`;
  } else {
    stage = `
      <div class="stage fallback">
        <p>This ${escapeHtml(options.fileType || 'file')} cannot be previewed in the browser.</p>
        <p class="muted">Download the original file to open it in its native application.</p>
        <a class="btn" href="${options.blobUrl}" download="${escapeHtml(fileName)}">Download file</a>
      </div>
    `;
  }

  target.document.open();
  target.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Elevata</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; background: #f4f1ea; font-family: Inter, Segoe UI, sans-serif; }
    body { display: flex; flex-direction: column; }
    header {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 14px 20px; background: #0f1724; color: #fff;
    }
    .meta { min-width: 0; }
    .meta h1 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta p { margin: 4px 0 0; font-size: 11px; color: #94a3b8; }
    .actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      height: 36px; padding: 0 14px; border-radius: 10px; font-size: 13px; font-weight: 700;
      text-decoration: none; color: #0f1724; background: #fff;
    }
    .btn.primary { background: #0ea5a4; color: #fff; }
    main { flex: 1; min-height: 0; padding: 16px; }
    .frame, .text-view, .stage { width: 100%; height: 100%; border: 0; background: #fff; border-radius: 16px; box-shadow: 0 12px 32px rgba(15,23,42,0.08); }
    .stage { display: flex; align-items: center; justify-content: center; overflow: auto; padding: 24px; }
    .stage img, .stage video { max-width: 100%; max-height: 100%; object-fit: contain; }
    .stage audio { width: min(520px, 100%); }
    .text-view { margin: 0; padding: 20px; overflow: auto; white-space: pre-wrap; word-break: break-word; font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; color: #334155; }
    .fallback { flex-direction: column; text-align: center; color: #334155; gap: 8px; }
    .muted { color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <div class="meta">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(fileName)}${options.fileType ? ` · ${escapeHtml(options.fileType)}` : ''}</p>
    </div>
    <div class="actions">
      <a class="btn primary" href="${options.blobUrl}" download="${escapeHtml(fileName)}">Download</a>
    </div>
  </header>
  <main>${stage}</main>
</body>
</html>`);
  target.document.close();
}
