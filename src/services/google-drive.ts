import { config } from "@/config";

export function getDriveImageUrl(fileId: string): string {
  if (!fileId) return "";
  return config.googleDrive.imageUrlFormat.replace("{FILE_ID}", fileId);
}

export function getDriveThumbnailUrl(fileId: string, width = 400): string {
  if (!fileId) return "";
  return `${config.googleDrive.imageUrlFormat.replace("{FILE_ID}", fileId)}&sz=w${width}`;
}

export function getDriveImageFallbackUrl(fileId: string): string {
  if (!fileId) return "";
  return config.googleDrive.fallbackFormat.replace("{FILE_ID}", fileId);
}

export function getPlaceholderImage(): string {
  return config.ui.placeholderImage;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fileId: string,
): void {
  const img = e.currentTarget;
  const currentSrc = img.src;
  const fallback = getDriveImageFallbackUrl(fileId);

  if (currentSrc !== fallback && fallback) {
    img.src = fallback;
  } else {
    img.src = getPlaceholderImage();
    img.onerror = null;
  }
}
