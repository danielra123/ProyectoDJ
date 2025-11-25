import { describe, expect, it, beforeEach } from "bun:test";
import { DeviceService } from "./device.service";
import { createMockDeviceRepository } from "../../__mocks__/repository.mock";
import { createMockEnteredDevice } from "../../__mocks__/test-helpers";
import { DeviceRepository } from "@core/repository";
import { SERVICE_ERRORS } from "./error";

describe("DeviceService", () => {
    let deviceService: DeviceService;
    let mockRepository: DeviceRepository;

    beforeEach(() => {
        mockRepository = createMockDeviceRepository();
        deviceService = new DeviceService(mockRepository);
    });

    describe("checkoutDevice", () => {
        it("should checkout an entered device successfully", async () => {
            const deviceId = "test-device-123";

            mockRepository.isDeviceEntered = async () => true;

            let checkoutCalled = false;
            let capturedId: string | undefined;
            let capturedDate: Date | undefined;

            mockRepository.checkoutDevice = async (id, datetime) => {
                checkoutCalled = true;
                capturedId = id;
                capturedDate = datetime;
            };

            await deviceService.checkoutDevice(deviceId);

            expect(checkoutCalled).toBe(true);
            expect(capturedId).toBe(deviceId);
            expect(capturedDate).toBeInstanceOf(Date);
        });

        it("should throw error when device is not entered", async () => {
            const deviceId = "non-existent-device";

            mockRepository.isDeviceEntered = async () => false;

            await expect(
                deviceService.checkoutDevice(deviceId)
            ).rejects.toThrow(SERVICE_ERRORS.DeviceNotFound);
        });

        it("should verify device exists before checkout", async () => {
            const deviceId = "test-device-456";
            let isEnteredCalled = false;

            mockRepository.isDeviceEntered = async (id) => {
                isEnteredCalled = true;
                expect(id).toBe(deviceId);
                return true;
            };

            mockRepository.checkoutDevice = async () => { };

            await deviceService.checkoutDevice(deviceId);

            expect(isEnteredCalled).toBe(true);
        });
    });

    describe("getEnteredDevices", () => {
        it("should return list of entered devices", async () => {
            const mockDevices = [
                createMockEnteredDevice({ type: "computer" }),
                createMockEnteredDevice({ type: "medical-device" }),
                createMockEnteredDevice({ type: "frequent-computer" })
            ];

            mockRepository.getEnteredDevices = async () => mockDevices;

            const result = await deviceService.getEnteredDevices({});

            expect(result).toEqual(mockDevices);
            expect(result.length).toBe(3);
        });

        it("should pass criteria to repository", async () => {
            const criteria = { limit: 5 };
            let capturedCriteria: any;

            mockRepository.getEnteredDevices = async (c) => {
                capturedCriteria = c;
                return [];
            };

            await deviceService.getEnteredDevices(criteria);

            expect(capturedCriteria).toEqual(criteria);
        });

        it("should return empty array when no devices entered", async () => {
            mockRepository.getEnteredDevices = async () => [];

            const result = await deviceService.getEnteredDevices({});

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });
    });
});
