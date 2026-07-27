export interface SyncConflictData {
  fileId?: string;
  fileName?: string;
  localContent?: string;
  remoteContent?: string;
  lastModifiedLocal?: string;
  lastModifiedRemote?: string;
  remoteTime?: string | number;
  localTime?: string | number;
}

