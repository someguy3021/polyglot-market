// Порты application-слоя (Clean): интерфейсы, реализации которых живут
// в infrastructure и подключаются в корне композиции (app.module).
export interface ImageStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  putPng(key: string, body: Buffer): Promise<void>;
  remove(key: string): Promise<void>;
}

export const IMAGE_STORAGE = Symbol("IMAGE_STORAGE");
