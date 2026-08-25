import React, { useRef } from 'react';

export default function PrintTagModal({ asset, onClose }) {
  const printAreaRef = useRef(null);

  if (!asset) return null;

  const handlePrint = () => {
    window.print();
  };

  // Gerador de padrão de código de barras vetorial SVG baseado na tag
  const generateBarcodeLines = (str) => {
    const chars = str.split('');
    return chars.map((c, i) => {
      const charCode = c.charCodeAt(0);
      const isWide = (charCode + i) % 3 === 0;
      const isSpace = (charCode + i) % 5 === 0;
      return (
        <rect
          key={i}
          x={i * 3.5}
          y="0"
          width={isWide ? "2.5" : "1.2"}
          height="32"
          fill={isSpace ? "transparent" : "#0f172a"}
        />
      );
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content print-tag-modal" style={{ maxWidth: '520px' }}>
        <header className="modal-header">
          <div>
            <h2>Etiqueta Patrimonial</h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Visualização para impressão física e identificação do bem
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-body" style={{ padding: '1.5rem 0' }}>
          {/* Card da Etiqueta Física Formatada */}
          <div className="tag-print-preview-container">
            <div className="tag-physical-sticker" ref={printAreaRef}>
              {/* Topo da Etiqueta: Logo + Nome da Empresa */}
              <div className="sticker-header">
                <div className="sticker-brand">
                  <span className="sticker-brand-title">TRYNOVA</span>
                  <span className="sticker-brand-sub">PATRIMÔNIO CORPORATIVO</span>
                </div>
                <div className="sticker-tag-number">
                  #{asset.tag}
                </div>
              </div>

              {/* Corpo da Etiqueta: QR Code + Detalhes */}
              <div className="sticker-body">
                {/* QR Code Simulado com SVG de alta fidelidade */}
                <div className="sticker-qrcode-wrapper">
                  <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Cantos do QR Code */}
                    <rect x="5" y="5" width="30" height="30" rx="3" stroke="#1e3a8a" strokeWidth="6" fill="white" />
                    <rect x="13" y="13" width="14" height="14" rx="2" fill="#1e3a8a" />

                    <rect x="65" y="5" width="30" height="30" rx="3" stroke="#1e3a8a" strokeWidth="6" fill="white" />
                    <rect x="73" y="13" width="14" height="14" rx="2" fill="#1e3a8a" />

                    <rect x="5" y="65" width="30" height="30" rx="3" stroke="#1e3a8a" strokeWidth="6" fill="white" />
                    <rect x="13" y="73" width="14" height="14" rx="2" fill="#1e3a8a" />

                    {/* Pontos internos decorativos */}
                    <rect x="42" y="10" width="8" height="8" fill="#1e3a8a" />
                    <rect x="42" y="24" width="8" height="8" fill="#1e3a8a" />
                    <rect x="10" y="42" width="8" height="8" fill="#1e3a8a" />
                    <rect x="24" y="42" width="8" height="8" fill="#1e3a8a" />
                    <rect x="42" y="42" width="16" height="16" fill="#1e3a8a" />
                    <rect x="65" y="42" width="8" height="8" fill="#1e3a8a" />
                    <rect x="79" y="42" width="8" height="8" fill="#1e3a8a" />
                    <rect x="42" y="65" width="8" height="8" fill="#1e3a8a" />
                    <rect x="42" y="79" width="8" height="8" fill="#1e3a8a" />
                    <rect x="65" y="65" width="12" height="12" fill="#1e3a8a" />
                    <rect x="83" y="83" width="10" height="10" fill="#1e3a8a" />
                  </svg>
                  <span className="sticker-scan-text">SCAN PATRIMÔNIO</span>
                </div>

                <div className="sticker-info">
                  <div className="sticker-asset-name" title={asset.name}>{asset.name}</div>
                  <div className="sticker-field">
                    <span className="s-lbl">Tipo:</span>
                    <span className="s-val">{asset.equipment}</span>
                  </div>
                  <div className="sticker-field">
                    <span className="s-lbl">Setor:</span>
                    <span className="s-val">{asset.location}</span>
                  </div>
                  {asset.serial_number && (
                    <div className="sticker-field">
                      <span className="s-lbl">S/N:</span>
                      <span className="s-val">{asset.serial_number}</span>
                    </div>
                  )}
                  {asset.employee && (
                    <div className="sticker-field">
                      <span className="s-lbl">Guarda:</span>
                      <span className="s-val">{asset.employee}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé da Etiqueta: Código de barras */}
              <div className="sticker-footer">
                <svg width="100%" height="24" viewBox="0 0 160 32" className="sticker-barcode-svg">
                  {generateBarcodeLines(asset.tag + (asset.serial_number || 'TRYN'))}
                </svg>
                <div className="sticker-barcode-caption">
                  PATRIMÔNIO INVENTARIADO — NÃO REMOVER
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="form-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Imprimir Etiqueta
          </button>
        </footer>
      </div>
    </div>
  );
}
