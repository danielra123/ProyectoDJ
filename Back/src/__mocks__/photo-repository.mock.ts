import { DevicePhotoRepository } from "@core/repository";
import { DeviceId } from "@core/domain";
import { mock } from "bun:test";

/**
 * Mock implementation of DevicePhotoRepository for unit testing
 */
export function createMockPhotoRepository(): DevicePhotoRepository {
    return {
        savePhoto: mock(async (photo: File, deviceId: DeviceId): Promise<URL> => {
            // Simulate Azure Blob Storage URL
            return new URL(`https://pds006.blob.core.windows.net/devices/${deviceId}.png`);
        })
    };
}
