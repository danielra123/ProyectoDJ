import { Computer, FrequentComputer, MedicalDevice, DeviceOwner, EnteredDevice } from "@core/domain";

/**
 * Helper functions to create test fixtures
 */

export function createMockOwner(overrides?: Partial<DeviceOwner>): DeviceOwner {
    return {
        name: "John Doe",
        id: "123456",
        ...overrides
    };
}

export function createMockComputer(overrides?: Partial<Computer>): Computer {
    return {
        id: crypto.randomUUID(),
        brand: "Dell",
        model: "Latitude",
        color: "Black",
        photoURL: new URL("https://example.com/photo.jpg"),
        owner: createMockOwner(),
        updatedAt: new Date(),
        ...overrides
    };
}

export function createMockFrequentComputer(overrides?: Partial<FrequentComputer>): FrequentComputer {
    const device = createMockComputer();
    return {
        device,
        checkinURL: new URL(`http://localhost:3000/api/computers/frequent/checkin/${device.id}`),
        checkoutURL: new URL(`http://localhost:3000/api/devices/checkout/${device.id}`),
        ...overrides
    };
}

export function createMockMedicalDevice(overrides?: Partial<MedicalDevice>): MedicalDevice {
    return {
        id: crypto.randomUUID(),
        brand: "GE",
        model: "ECG1000",
        serial: "SN123456",
        photoURL: new URL("https://example.com/medical.jpg"),
        owner: createMockOwner(),
        updatedAt: new Date(),
        ...overrides
    };
}

export function createMockEnteredDevice(overrides?: Partial<EnteredDevice>): EnteredDevice {
    return {
        id: crypto.randomUUID(),
        brand: "HP",
        model: "EliteBook",
        owner: createMockOwner(),
        updatedAt: new Date(),
        type: "computer",
        ...overrides
    };
}

export async function createMockImageFile(): Promise<File> {
    const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
        0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54,
        0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03,
        0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0x18, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return new File([pngBytes], "test.png", { type: "image/png" });
}
