import { join } from 'path'

export type StorageSubdir = 'imports' | 'reports' | 'backups' | 'temp' | 'logs'

export function getStorageRoot(): string {
  return process.env.STORAGE_PATH ?? join(process.cwd(), 'storage')
}

export function getStorageDir(subdir: StorageSubdir): string {
  return join(getStorageRoot(), subdir)
}
