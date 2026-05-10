// Template Message Renderer Component - Rebuilt from scratch
interface TemplateMessageRendererProps {
  message: any;
  templates: any[];
}

export function TemplateMessageRenderer({ message, templates }: TemplateMessageRendererProps) {
  const { templateName, templateComponents, displayText } = message;
  
  
  // Find the template by name
  const template = templates.find(t => t.name === templateName);
  
  if (!template) {
    console.log('No template found, falling back to displayText');
    return <div className="text-gray-600 dark:text-slate-400">{displayText || message.textBody || 'Template message'}</div>;
  }

  // Create a preview by merging template structure with actual data
  const createTemplatePreview = () => {
    const preview: any = {
      header: null,
      body: null,
      footer: null,
      buttons: []
    };

    // Helper function to replace template variables with actual data
    const replaceVariables = (text: string, actualParams: any[] = []) => {
      if (!text || !actualParams) return text;
      
      let result = text;
      actualParams.forEach((param, index) => {
        // Replace {{1}}, {{2}}, etc. with actual parameter values
        const placeholder = `{{${index + 1}}}`;
        result = result.replace(placeholder, param.text || param.payload || param.url || '');
      });
      
      return result;
    };

    // Process each component from the template
    template.components?.forEach((comp: any) => {
      switch (comp.type) {
        case 'HEADER':
          // Find actual header parameters from stored components
          const headerParams = templateComponents?.find((c: any) => c.type === 'header')?.parameters || [];
          
          preview.header = {
            type: comp.format, // image, video, document, text
            text: comp.text,
            example: comp.example,
            actualParams: headerParams,
            resolvedText: replaceVariables(comp.text, headerParams)
          };
          
          // Handle media URLs
          if (comp.format === 'IMAGE' && headerParams[0]?.image?.link) {
            preview.header.imageUrl = headerParams[0].image.link;
          } else if (comp.format === 'VIDEO' && headerParams[0]?.video?.link) {
            preview.header.videoUrl = headerParams[0].video.link;
          } else if (comp.format === 'DOCUMENT' && headerParams[0]?.document?.link) {
            preview.header.documentUrl = headerParams[0].document.link;
            preview.header.documentFilename = headerParams[0].document.filename;
          }
          break;
          
        case 'BODY':
          // Find actual body parameters from stored components
          const bodyParams = templateComponents?.find((c: any) => c.type === 'body')?.parameters || [];
          
          preview.body = {
            text: comp.text,
            example: comp.example,
            actualParams: bodyParams,
            resolvedText: replaceVariables(comp.text, bodyParams)
          };
          break;
          
        case 'FOOTER':
          preview.footer = {
            text: comp.text
          };
          break;
          
        case 'BUTTONS':
          preview.buttons = comp.buttons?.map((btn: any) => ({
            type: btn.type,
            text: btn.text,
            url: btn.url,
            phone_number: btn.phone_number
          })) || [];
          break;
      }
    });

    return preview;
  };

  const preview = createTemplatePreview();

  return (
    <div className="template-message bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700/50 shadow-sm max-w-sm">
      <div className="text-xs text-gray-500 dark:text-slate-400 mb-3 font-medium">Template: {templateName}</div>
      
      {/* Header */}
      {preview.header && (
        <div className="mb-3">
          {preview.header.type === 'IMAGE' && preview.header.imageUrl && (
            <div className="mb-2">
              <img 
                src={preview.header.imageUrl} 
                alt="Header image" 
                className="max-w-full h-auto rounded-lg shadow-sm"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          {preview.header.type === 'IMAGE' && !preview.header.imageUrl && (
            <div className="bg-gray-100 dark:bg-slate-900/50 rounded-lg p-4 text-center text-gray-500 dark:text-slate-400">
              📷 Image
            </div>
          )}
          {preview.header.type === 'VIDEO' && preview.header.videoUrl && (
            <div className="mb-2">
              <video 
                src={preview.header.videoUrl} 
                controls 
                className="max-w-full h-auto rounded-lg shadow-sm"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}
          {preview.header.type === 'VIDEO' && !preview.header.videoUrl && (
            <div className="bg-gray-100 dark:bg-slate-900/50 rounded-lg p-4 text-center text-gray-500 dark:text-slate-400">
              🎥 Video
            </div>
          )}
          {preview.header.type === 'DOCUMENT' && preview.header.documentUrl && (
            <div className="mb-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📄</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{preview.header.documentFilename || 'Document'}</div>
                  <a 
                    href={preview.header.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
          {preview.header.type === 'DOCUMENT' && !preview.header.documentUrl && (
            <div className="bg-gray-100 dark:bg-slate-900/50 rounded-lg p-4 text-center text-gray-500 dark:text-slate-400">
              📄 Document
            </div>
          )}
          {preview.header.type === 'TEXT' && preview.header.resolvedText && (
            <div className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
              {preview.header.resolvedText}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      {preview.body && (
        <div className="mb-3 text-gray-800 dark:text-slate-200 leading-relaxed">
          {preview.body.resolvedText || preview.body.text}
        </div>
      )}

      {/* Footer */}
      {preview.footer && (
        <div className="text-sm text-gray-500 dark:text-slate-400 mt-3 italic">
          {preview.footer.text}
        </div>
      )}

      {/* Buttons */}
      {preview.buttons.length > 0 && (
        <div className="mt-4 space-y-2">
          {preview.buttons.map((btn: any, index: number) => (
            <div key={index}>
              {btn.type === 'QUICK_REPLY' && (
                <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200">
                  {btn.text}
                </div>
              )}
              {btn.type === 'URL' && (
                <a 
                  href={btn.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium border border-green-200 hover:bg-green-200 transition-colors"
                >
                  {btn.text}
                </a>
              )}
              {btn.type === 'PHONE_NUMBER' && (
                <a 
                  href={`tel:${btn.phone_number}`}
                  className="block bg-purple-100 text-purple-800 px-3 py-2 rounded-lg text-sm font-medium border border-purple-200 hover:bg-purple-200 transition-colors"
                >
                  {btn.text}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fallback if no preview content */}
      {!preview.header && !preview.body && !preview.footer && preview.buttons.length === 0 && (
        <div className="text-gray-600 dark:text-slate-400">{displayText || 'Template message'}</div>
      )}
    </div>
  );
}
