// Template Message Renderer — exact WhatsApp Web style
// NOTE: Quick-reply buttons are rendered by MessagesList (outside the bubble), NOT here.
// This component only renders: media-header, text-header, body, footer, action-buttons (URL/PHONE).
import { ExternalLink, Phone, FileText, PlayCircle } from 'lucide-react';

interface TemplateMessageRendererProps {
  message: any;
  templates: any[];
  direction?: 'inbound' | 'outbound';
}

export function TemplateMessageRenderer({
  message,
  templates,
  direction = 'inbound',
}: TemplateMessageRendererProps) {
  const { templateName, templateComponents, displayText } = message;

  const template = templates.find((t) => t.name === templateName);
  const isSessionTemplate = !template && templateComponents && templateComponents.length > 0;

  if (!template && !isSessionTemplate) {
    return (
      <div className="wa-tmpl-body-text">
        {displayText || message.textBody || 'Template message'}
      </div>
    );
  }

  // ── Build preview object ────────────────────────────────────────
  const buildPreview = () => {
    const preview: {
      header: any;
      body: any;
      footer: any;
      actionButtons: any[];   // URL / PHONE — rendered inside bubble
    } = { header: null, body: null, footer: null, actionButtons: [] };

    const replaceVars = (text: string, params: any[] = []) => {
      if (!text) return text;
      let r = text;
      params.forEach((p, i) => {
        r = r.replace(`{{${i + 1}}}`, p.text || p.payload || p.url || '');
      });
      return r;
    };

    if (isSessionTemplate) {
      templateComponents.forEach((comp: any) => {
        const t = comp.type?.toUpperCase();
        if (t === 'HEADER') {
          preview.header = {
            format: comp.format || 'TEXT',
            text: comp.text,
            imageUrl: comp.imageUrl || (comp.format === 'IMAGE' ? comp.text : null),
            videoUrl: comp.videoUrl || (comp.format === 'VIDEO' ? comp.text : null),
            documentUrl: comp.documentUrl || (comp.format === 'DOCUMENT' ? comp.text : null),
            documentFilename: comp.documentFilename,
          };
        } else if (t === 'BODY') {
          preview.body = comp.text;
        } else if (t === 'FOOTER') {
          preview.footer = comp.text;
        } else if (t === 'BUTTONS') {
          preview.actionButtons = (comp.buttons || []).filter(
            (b: any) => b.type === 'URL' || b.type === 'PHONE_NUMBER'
          );
        }
      });
      return preview;
    }

    // Meta template
    template.components?.forEach((comp: any) => {
      if (comp.type === 'HEADER') {
        const hParams = templateComponents?.find((c: any) => c.type === 'header')?.parameters || [];
        preview.header = {
          format: comp.format,
          text: replaceVars(comp.text, hParams),
          imageUrl: comp.format === 'IMAGE' ? hParams[0]?.image?.link : null,
          videoUrl: comp.format === 'VIDEO' ? hParams[0]?.video?.link : null,
          documentUrl: comp.format === 'DOCUMENT' ? hParams[0]?.document?.link : null,
          documentFilename: comp.format === 'DOCUMENT' ? hParams[0]?.document?.filename : null,
        };
      } else if (comp.type === 'BODY') {
        const bParams = templateComponents?.find((c: any) => c.type === 'body')?.parameters || [];
        preview.body = replaceVars(comp.text, bParams);
      } else if (comp.type === 'FOOTER') {
        preview.footer = comp.text;
      } else if (comp.type === 'BUTTONS') {
        preview.actionButtons = (comp.buttons || []).filter(
          (b: any) => b.type === 'URL' || b.type === 'PHONE_NUMBER'
        );
      }
    });

    return preview;
  };

  const p = buildPreview();
  const isOut = direction === 'outbound';

  return (
    <div className="wa-tmpl-wrap">
      {/* ── IMAGE header ── */}
      {p.header?.format === 'IMAGE' && (
        p.header.imageUrl
          ? <div className="wa-tmpl-media-wrap">
              <img
                src={p.header.imageUrl}
                alt="Template header"
                className="wa-tmpl-media"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          : <div className="wa-tmpl-media-placeholder">🖼️</div>
      )}

      {/* ── VIDEO header ── */}
      {p.header?.format === 'VIDEO' && (
        p.header.videoUrl
          ? <div className="wa-tmpl-media-wrap">
              <video src={p.header.videoUrl} controls className="wa-tmpl-media" />
            </div>
          : <div className="wa-tmpl-media-placeholder">
              <PlayCircle className="h-7 w-7 opacity-50" />
              <span className="text-xs mt-1 opacity-60">Video</span>
            </div>
      )}

      {/* ── DOCUMENT header ── */}
      {p.header?.format === 'DOCUMENT' && (
        <div className={`wa-tmpl-doc ${isOut ? 'wa-tmpl-doc-out' : 'wa-tmpl-doc-in'}`}>
          <FileText className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold truncate leading-tight">
              {p.header.documentFilename || 'Document'}
            </span>
            {p.header.documentUrl && (
              <a
                href={p.header.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] underline opacity-70 hover:opacity-100"
              >
                Download
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── TEXT header ── */}
      {p.header?.format === 'TEXT' && p.header.text && (
        <div className={`wa-tmpl-text-header ${isOut ? 'wa-tmpl-text-header-out' : 'wa-tmpl-text-header-in'}`}>
          {p.header.text}
        </div>
      )}

      {/* ── BODY ── */}
      {p.body && (
        <div className={`wa-tmpl-body-text ${isOut ? 'wa-tmpl-body-out' : 'wa-tmpl-body-in'}`}>
          {p.body}
        </div>
      )}

      {/* ── FOOTER ── */}
      {p.footer && (
        <div className={`wa-tmpl-footer ${isOut ? 'wa-tmpl-footer-out' : 'wa-tmpl-footer-in'}`}>
          {p.footer}
        </div>
      )}

      {/* ── Fallback ── */}
      {!p.header && !p.body && !p.footer && p.actionButtons.length === 0 && (
        <div className={`wa-tmpl-body-text ${isOut ? 'wa-tmpl-body-out' : 'wa-tmpl-body-in'}`}>
          {displayText || message.textBody || 'Template message'}
        </div>
      )}

      {/* ── Action buttons (URL / Phone) — inside bubble, above the divider line ── */}
      {p.actionButtons.length > 0 && (
        <div className="wa-tmpl-action-list">
          {p.actionButtons.map((btn: any, i: number) => (
            <div key={i} className={`wa-tmpl-action-row ${isOut ? 'wa-tmpl-divider-out' : 'wa-tmpl-divider-in'}`}>
              {btn.type === 'URL' ? (
                <a
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`wa-tmpl-action-btn ${isOut ? 'wa-tmpl-action-btn-out' : 'wa-tmpl-action-btn-in'}`}
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  {btn.text}
                </a>
              ) : (
                <a
                  href={`tel:${btn.phone_number}`}
                  className={`wa-tmpl-action-btn ${isOut ? 'wa-tmpl-action-btn-out' : 'wa-tmpl-action-btn-in'}`}
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  {btn.text}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
