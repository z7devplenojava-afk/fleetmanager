export type KioskPlatform = 'ANDROID' | 'WINDOWS' | 'WEB' | 'UNKNOWN';
export type KioskOrientation = 'PORTRAIT' | 'LANDSCAPE';
export type KioskDeviceStatus = 'PENDING_PAIRING' | 'ONLINE' | 'OFFLINE' | 'REVOKED' | 'ERROR';

export interface KioskDevice {
  id: string;
  companyId: string;
  companyName?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  name: string;
  description?: string;
  deviceCode: string;
  platform: KioskPlatform;
  platformVersion?: string;
  playerVersion?: string;
  resolutionWidth: number;
  resolutionHeight: number;
  orientation: KioskOrientation;
  status: KioskDeviceStatus;
  lastHeartbeatAt?: string;
  activePresentationVersionId?: string;
  desiredPresentationVersionId?: string;
  pairedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'VIDEO' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';

export interface KioskMediaAsset {
  id: string;
  companyId: string;
  name: string;
  mediaType: MediaType;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  checksumSha256: string;
  durationMs?: number;
  width?: number;
  height?: number;
  thumbnailStorageKey?: string;
  processingStatus: 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR';
  createdAt: string;
}

export type PresentationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KioskPresentation {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: PresentationStatus;
  homeSlideId?: string;
  idleTimeoutSeconds: number;
  slidesCount?: number;
  activeVersionNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KioskSlide {
  id: string;
  presentationId: string;
  name: string;
  position: number;
  durationMs?: number | null;
  transitionType: 'FADE' | 'SLIDE_LEFT' | 'SLIDE_RIGHT' | 'ZOOM' | 'NONE';
  interactionMode: 'AUTOMATIC' | 'INTERACTIVE' | 'HYBRID';
  backgroundType: 'COLOR' | 'IMAGE' | 'VIDEO';
  backgroundMediaId?: string;
  elements: KioskSlideElement[];
}

export type SlideElementType =
  | 'VIDEO'
  | 'IMAGE'
  | 'TEXT'
  | 'BUTTON'
  | 'GALLERY'
  | 'CARD'
  | 'QR_CODE'
  | 'FORM'
  | 'WEB_CONTENT';

export interface KioskSlideElement {
  id: string;
  slideId: string;
  elementType: SlideElementType;
  content: Record<string, any>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  style?: Record<string, any>;
  action?: Record<string, any>;
}

export interface KioskPublication {
  id: string;
  deviceId: string;
  deviceName?: string;
  presentationVersionId: string;
  versionNumber?: number;
  status: 'QUEUED' | 'NOTIFIED' | 'DOWNLOADING' | 'READY' | 'ACTIVATED' | 'FAILED' | 'CANCELLED';
  progressPercent: number;
  lastError?: string;
  scheduledAt?: string;
  createdAt: string;
  downloadedAt?: string;
  activatedAt?: string;
}

export interface KioskDeviceEvent {
  id: string;
  deviceId: string;
  eventType: string;
  eventPayload: Record<string, any>;
  occurredAt: string;
  receivedAt: string;
}

export interface KioskPairingCodeResponse {
  pairingCode: string;
  expiresAt: string;
  deviceId: string;
  qrCodeDataUrl?: string;
}

