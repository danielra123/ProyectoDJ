import { DeviceRepository } from "@core/repository";
import { Computer, DeviceCriteria, DeviceId, EnteredDevice, FrequentComputer, MedicalDevice, DeviceHistoryEntry, DeviceHistoryFilters } from "@core/domain";
import { mock } from "bun:test";

/**
 * Mock implementation of DeviceRepository for unit testing
 */
export function createMockDeviceRepository(): DeviceRepository {
    return {
        registerFrequentComputer: mock(async (computer: FrequentComputer): Promise<FrequentComputer> => {
            return computer;
        }),

        getMedicalDevices: mock(async (criteria: DeviceCriteria): Promise<MedicalDevice[]> => {
            return [];
        }),

        getComputers: mock(async (criteria: DeviceCriteria): Promise<Computer[]> => {
            return [];
        }),

        getFrequentComputers: mock(async (criteria: DeviceCriteria): Promise<FrequentComputer[]> => {
            return [];
        }),

        getEnteredDevices: mock(async (criteria: DeviceCriteria): Promise<EnteredDevice[]> => {
            return [];
        }),

        checkinComputer: mock(async (computer: Computer): Promise<Computer> => {
            return computer;
        }),

        checkinMedicalDevice: mock(async (device: MedicalDevice): Promise<MedicalDevice> => {
            return device;
        }),

        checkinFrequentComputer: mock(async (id: DeviceId, datetime: Date): Promise<FrequentComputer> => {
            return {
                device: {
                    id,
                    brand: "Test",
                    model: "Test",
                    owner: { name: "Test", id: "123" },
                    updatedAt: new Date(),
                    checkinAt: datetime
                },
                checkinURL: new URL(`http://localhost:3000/api/computers/frequent/checkin/${id}`),
                checkoutURL: new URL(`http://localhost:3000/api/devices/checkout/${id}`)
            };
        }),

        checkoutDevice: mock(async (id: DeviceId, datetime: Date): Promise<void> => {
            return;
        }),

        isDeviceEntered: mock(async (id: DeviceId): Promise<boolean> => {
            return true;
        }),

        isFrequentComputerRegistered: mock(async (id: DeviceId): Promise<boolean> => {
            return true;
        }),

        getDeviceHistory: mock(async (filters?: DeviceHistoryFilters): Promise<DeviceHistoryEntry[]> => {
            return [];
        })
    };
}
