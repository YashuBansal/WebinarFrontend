import type { VariableMapping } from '@/schemas/configuredTemplateSchema';

export interface ResolveOptions {
  dynamicLabelResolver?: (dynamicFieldValue?: string) => string;
  includeFallbackInLabel?: boolean;
}

export function resolveConfiguredBodyPreview(
  bodyText: string,
  variableMappings: VariableMapping[],
  options?: ResolveOptions
): string {
  if (!bodyText || !Array.isArray(variableMappings)) return bodyText || '';

  const dynamicLabelResolver = options?.dynamicLabelResolver;
  const includeFallback = options?.includeFallbackInLabel !== false;

  let previewText = bodyText;

  variableMappings.forEach((mapping, index) => {
    const placeholder = `{{${index + 1}}}`;
    const placeholderRegex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');

    let replacementValue = '';

    if (mapping.isDynamic) {
      const label = dynamicLabelResolver ? dynamicLabelResolver(mapping.dynamicField) : (mapping.dynamicField || 'dynamic');
      const fallbackText = includeFallback && mapping.fallbackValue ? ` (fallback: "${mapping.fallbackValue}")` : '';
      replacementValue = `[${label}${fallbackText}]`;
    } else {
      replacementValue = mapping.staticValue || placeholder;
    }

    previewText = previewText.replace(placeholderRegex, replacementValue);
  });

  return previewText;
}


