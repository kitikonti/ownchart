/**
 * SVG export options component.
 * Timeline scale options are shared with PNG export via ScaleOptions.
 * This component is a placeholder for future SVG-specific options.
 */

/**
 * SVG-specific export options.
 * Currently returns null as timeline scale is handled by ScaleOptions.
 * TODO: add SVG-specific options (e.g. responsiveMode, includeAccessibility) when needed.
 */
export function SvgExportOptions(): JSX.Element | null {
  // No SVG-specific options currently - timeline scale is handled by ScaleOptions
  return null;
}
