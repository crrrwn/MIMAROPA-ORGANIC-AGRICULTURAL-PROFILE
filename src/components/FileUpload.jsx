import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import mammoth from 'mammoth';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif';
const MAX_SIZE_KB = 400;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  const map = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return map[ext] || 'application/octet-stream';
}

function getFileUrl(item) {
  if (item.url) return item.url;
  if (item.data) return `data:${getMimeType(item.name)};base64,${item.data}`;
  return null;
}

function isImageType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
}

function isPdfType(filename) {
  return (filename || '').toLowerCase().endsWith('.pdf');
}

function isDocxType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  return ['doc', 'docx'].includes(ext);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function FileViewerModal({ item, onClose }) {
  const url = getFileUrl(item);
  const [docxHtml, setDocxHtml] = useState(null);
  const [docxError, setDocxError] = useState(null);
  const [docxLoading, setDocxLoading] = useState(false);

  const isImage = isImageType(item.name);
  const isPdf = isPdfType(item.name);
  const isDocx = isDocxType(item.name);

  useEffect(() => {
    if (!isDocx || !item?.data) {
      setDocxHtml(null);
      setDocxError(null);
      return;
    }
    setDocxLoading(true);
    setDocxError(null);
    const ab = base64ToArrayBuffer(item.data);
    mammoth.convertToHtml({ arrayBuffer: ab })
      .then((result) => {
        setDocxHtml(result.value);
      })
      .catch((err) => {
        setDocxError(err.message || 'Failed to load document');
      })
      .finally(() => setDocxLoading(false));
  }, [isDocx, item?.data]);

  if (!url && !(isDocx && item?.data)) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border-2 border-slate-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-300">
          <span className="font-medium text-gray-900 truncate flex-1">{item.name}</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Icon icon="mdi:close" className="text-xl text-gray-600" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px] bg-gray-100">
          {isImage && <img src={url} alt={item.name} className="max-w-full max-h-[70vh] object-contain" />}
          {isPdf && !isImage && <iframe src={url} title={item.name} className="w-full min-h-[70vh] border-0" />}
          {isDocx && (
            <>
              {docxLoading && <p className="text-gray-500">Loading document...</p>}
              {docxError && <p className="text-red-600">{docxError}</p>}
              {docxHtml && !docxLoading && (
                <div
                  className="w-full max-w-2xl mx-auto bg-white p-8 shadow-sm rounded-lg text-left text-gray-800 [&_p]:mb-2 [&_h1]:text-xl [&_h2]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:border [&_td]:border [&_th]:border [&_td]:p-2 [&_th]:p-2"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              )}
            </>
          )}
          {!isImage && !isPdf && !isDocx && (
            <p className="text-gray-600">Preview not available for this file type. Use Download to save the file.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function FileUpload({ value = [], onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewingItem, setViewingItem] = useState(null);

  const files = Array.isArray(value) ? value : [];

  const handleFileSelect = async (e) => {
    const selected = e.target.files;
    if (!selected?.length || disabled) return;

    setError('');
    const oversized = [];
    const valid = [];

    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      if (f.size > MAX_SIZE_KB * 1024) oversized.push(f.name);
      else valid.push(f);
    }

    if (oversized.length) {
      setError(`File(s) too large (max ${MAX_SIZE_KB}KB each): ${oversized.join(', ')}`);
    }
    if (valid.length === 0 && oversized.length === 0) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of valid) {
        const data = await fileToBase64(file);
        uploaded.push({ name: file.name, data });
      }
      onChange([...files, ...uploaded]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  const viewFile = (item) => setViewingItem(item);

  const downloadFile = (item) => {
    const url = getFileUrl(item);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name || 'file';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <label className={`inline-flex items-center gap-2 px-5 py-3 bg-oa-green hover:bg-oa-green-dark text-white rounded-xl cursor-pointer font-semibold shadow-lg ring-2 ring-oa-green/40 transition ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Icon icon="mdi:upload" className="text-xl" />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        <span className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max {MAX_SIZE_KB}KB each)</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-2 mt-2">
          {files.map((item, idx) => (
            <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm border-2 border-slate-300">
              <span className="truncate flex-1 min-w-0" title={item.name}>{item.name}</span>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => viewFile(item)} className="px-3 py-1.5 rounded-lg bg-oa-blue/10 text-oa-blue hover:bg-oa-blue/20 font-medium transition flex items-center gap-1">
                  <Icon icon="mdi:eye" /> View
                </button>
                <button type="button" onClick={() => downloadFile(item)} className="px-3 py-1.5 rounded-lg bg-oa-green/10 text-oa-green hover:bg-oa-green/20 font-medium transition flex items-center gap-1">
                  <Icon icon="mdi:download" /> Download
                </button>
                {!disabled && (
                  <button type="button" onClick={() => removeFile(idx)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition">
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {viewingItem && (
        <FileViewerModal item={viewingItem} onClose={() => setViewingItem(null)} />
      )}
    </div>
  );
}

export function FileList({ files = [], compact }) {
  const [viewingItem, setViewingItem] = useState(null);
  const list = Array.isArray(files) ? files : [];

  const viewFile = (item) => setViewingItem(item);

  const downloadFile = (item) => {
    const url = getFileUrl(item);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name || 'file';
    a.target = '_blank';
    a.click();
  };

  if (list.length === 0) return null;

  return (
    <div className={compact ? '' : 'space-y-1'}>
      <strong className="block text-sm text-gray-800 mb-1">Attachments:</strong>
      <ul className={compact ? 'flex flex-wrap gap-2' : 'space-y-1'}>
        {list.map((item, idx) => (
          <li key={idx} className={`flex items-center gap-2 ${compact ? 'text-sm' : 'text-sm'}`}>
            <Icon icon="mdi:file-document-outline" className="text-oa-green shrink-0" />
            <span className="truncate max-w-[180px]" title={item.name}>{item.name}</span>
            <button type="button" onClick={() => viewFile(item)} className="px-2 py-1 rounded bg-oa-blue/10 text-oa-blue hover:bg-oa-blue/20 text-xs font-medium transition">
              View
            </button>
            <button type="button" onClick={() => downloadFile(item)} className="px-2 py-1 rounded bg-oa-green/10 text-oa-green hover:bg-oa-green/20 text-xs font-medium transition">
              Download
            </button>
          </li>
        ))}
      </ul>
      {viewingItem && (
        <FileViewerModal item={viewingItem} onClose={() => setViewingItem(null)} />
      )}
    </div>
  );
}
