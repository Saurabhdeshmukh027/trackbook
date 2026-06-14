import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, back = true, right }) {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-soft"
          style={{ width: 46, height: 46, padding: 0, flexShrink: 0 }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="page-header-copy flex-1 min-w-0">
        <h1 className="truncate">{title}</h1>
        {subtitle && <p className="truncate">{subtitle}</p>}
      </div>

      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
