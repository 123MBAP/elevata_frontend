import React from 'react';
import {
  FileText,
  FileCheck,
  FileSpreadsheet,
  FileBadge,
  Download,
  ExternalLink,
  Trash2,
  File,
  Eye,
  CheckCircle2
} from 'lucide-react';

export interface GuideDocumentData {
  name: string;
  url?: string;
  fileData?: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

interface GuideDocumentCardProps {
  document: GuideDocumentData;
  onRemove?: () => void;
  className?: string;
  isEditable?: boolean;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return 'Guide Document';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileTypeInfo = (docName: string, mimeType?: string) => {
  const lowerName = docName.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) {
    return {
      badge: 'PDF',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: <FileText className="w-5 h-5 text-rose-600" />
    };
  }
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerMime.includes('word') || lowerMime.includes('msword')) {
    return {
      badge: 'DOCX',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <FileCheck className="w-5 h-5 text-blue-600" />
    };
  }
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv') || lowerMime.includes('spreadsheet') || lowerMime.includes('excel')) {
    return {
      badge: 'SHEET',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
    };
  }
  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx') || lowerMime.includes('presentation')) {
    return {
      badge: 'SLIDES',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <FileBadge className="w-5 h-5 text-amber-600" />
    };
  }
  return {
    badge: 'DOC',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: <File className="w-5 h-5 text-sky-600" />
  };
};

export default function GuideDocumentCard({
  document,
  onRemove,
  className = '',
  isEditable = false
}: GuideDocumentCardProps) {
  const typeInfo = getFileTypeInfo(document.name, document.type);

  const handleDownloadOrOpen = () => {
    if (document.fileData) {
      const link = window.document.createElement('a');
      link.href = document.fileData;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else if (document.url) {
      window.open(document.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-[#2998d6]/50 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${typeInfo.color}`}>
          {typeInfo.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
              {document.name}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono shrink-0 ${typeInfo.color}`}>
              {typeInfo.badge}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>{formatFileSize(document.size)}</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified Guide Document
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {(document.fileData || document.url) && (
          <button
            type="button"
            onClick={handleDownloadOrOpen}
            className="px-3.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download or view official guide document"
          >
            {document.fileData ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{document.fileData ? 'Download Guide' : 'Open Document'}</span>
          </button>
        )}

        {isEditable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
            title="Remove guide document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
