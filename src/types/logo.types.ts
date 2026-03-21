/**
 * Project logo types for export embedding.
 */

/** Allowed MIME types for logo images */
export type LogoMimeType = "image/png" | "image/jpeg" | "image/svg+xml";

/**
 * A project logo stored as Base64 for embedding in exports.
 * Persisted in ViewSettings and the .ownchart file format.
 */
export interface ProjectLogo {
  /** Base64-encoded image content (without the data: URL prefix) */
  data: string;
  /** MIME type of the original image file */
  mimeType: LogoMimeType;
  /** Original filename for display in the UI */
  fileName: string;
  /** Intrinsic image width in pixels (for aspect ratio calculation) */
  width: number;
  /** Intrinsic image height in pixels (for aspect ratio calculation) */
  height: number;
}
