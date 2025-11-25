import { describe, expect, it, beforeEach } from "bun:test";
import { MedicalDeviceService } from "./medical-device.service";
import { createMockDeviceRepository } from "../../__mocks__/repository.mock";
import { createMockPhotoRepository } from "../../__mocks__/photo-repository.mock";
import { createMockMedicalDevice, createMockImageFile } from "../../__mocks__/test-helpers";
import { DeviceRepository, DevicePhotoRepository } from "@core/repository";

describe("MedicalDeviceService", () => {
    let medicalDeviceService: MedicalDeviceService;
    let mockRepository: DeviceRepository;
    let mockPhotoRepository: DevicePhotoRepository;

    beforeEach(() => {
        mockRepository = createMockDeviceRepository();
        mockPhotoRepository = createMockPhotoRepository();
        medicalDeviceService = new MedicalDeviceService(mockRepository, mockPhotoRepository);
    });

    describe("getMedicalDevices", () => {
        it("should return list of medical devices", async () => {
            const mockDevices = [
                createMockMedicalDevice(),
                createMockMedicalDevice({ brand: "Philips", model: "MRI-2000" })
            ];

            mockRepository.getMedicalDevices = async () => mockDevices;

            const result = await medicalDeviceService.getMedicalDevices({});

            expect(result).toEqual(mockDevices);
            expect(result.length).toBe(2);
        });

        it("should pass criteria to repository", async () => {
            const criteria = { limit: 10 };
            let capturedCriteria: any;

            mockRepository.getMedicalDevices = async (c) => {
                capturedCriteria = c;
                return [];
            };

            await medicalDeviceService.getMedicalDevices(criteria);

            expect(capturedCriteria).toEqual(criteria);
        });

        it("should return empty array when no devices found", async () => {
            mockRepository.getMedicalDevices = async () => [];

            const result = await medicalDeviceService.getMedicalDevices({});

            expect(result).toEqual([]);
            expect(result.length).toBe(0);
        });
    });

    describe("checkinMedicalDevice", () => {
        it("should checkin medical device successfully", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "GE",
                model: "ECG1000",
                ownerName: "Dr. Smith",
                ownerId: "DOC123",
                serial: "SN-12345",
                photo: mockPhoto
            };

            let savedDevice: any;
            mockRepository.checkinMedicalDevice = async (device) => {
                savedDevice = device;
                return device;
            };

            const result = await medicalDeviceService.checkinMedicalDevice(request);

            expect(result.brand).toBe("GE");
            expect(result.model).toBe("ECG1000");
            expect(result.serial).toBe("SN-12345");
            expect(result.owner.name).toBe("Dr. Smith");
            expect(result.owner.id).toBe("DOC123");
            expect(savedDevice).toBeDefined();
        });

        it("should assign checkin timestamp", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "Siemens",
                model: "X-Ray Pro",
                ownerName: "Dr. Johnson",
                ownerId: "DOC456",
                serial: "XR-98765",
                photo: mockPhoto
            };

            const beforeCheckin = new Date();

            mockRepository.checkinMedicalDevice = async (device) => device;

            const result = await medicalDeviceService.checkinMedicalDevice(request);

            expect(result.checkinAt).toBeDefined();
            expect(result.checkinAt).toBeInstanceOf(Date);
            expect(result.checkinAt!.getTime()).toBeGreaterThanOrEqual(beforeCheckin.getTime());
        });

        it("should save photo and include URL", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "Philips",
                model: "Ultrasound",
                ownerName: "Dr. Williams",
                ownerId: "DOC789",
                serial: "US-54321",
                photo: mockPhoto
            };

            mockRepository.checkinMedicalDevice = async (device) => device;

            const result = await medicalDeviceService.checkinMedicalDevice(request);

            expect(result.photoURL).toBeDefined();
            expect(result.photoURL.toString()).toContain("blob.core.windows.net");
            expect(result.photoURL.toString()).toContain("pds006");
        });

        it("should validate request schema", async () => {
            const invalidRequest = {
                brand: "GE",
                model: "Test",
                ownerName: "Dr", // Too short
                ownerId: "123",
                serial: "SN123"
            };

            await expect(
                medicalDeviceService.checkinMedicalDevice(invalidRequest as any)
            ).rejects.toThrow();
        });

        it("should validate serial number is required", async () => {
            const mockPhoto = await createMockImageFile();
            const requestWithoutSerial = {
                brand: "GE",
                model: "ECG1000",
                ownerName: "Dr. Smith",
                ownerId: "DOC123",
                photo: mockPhoto
                // serial is missing
            };

            await expect(
                medicalDeviceService.checkinMedicalDevice(requestWithoutSerial as any)
            ).rejects.toThrow();
        });
    });
});
