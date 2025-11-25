import { describe, expect, it, beforeEach } from "bun:test";
import { ComputerService } from "./computer.service";
import { createMockDeviceRepository } from "../../__mocks__/repository.mock";
import { createMockPhotoRepository } from "../../__mocks__/photo-repository.mock";
import { createMockComputer, createMockFrequentComputer, createMockImageFile } from "../../__mocks__/test-helpers";
import { DeviceRepository } from "@core/repository";
import { DevicePhotoRepository } from "@core/repository";
import { SERVICE_ERRORS } from "./error";

describe("ComputerService", () => {
    let computerService: ComputerService;
    let mockRepository: DeviceRepository;
    let mockPhotoRepository: DevicePhotoRepository;
    const baseURL = new URL("http://localhost:3000/api");

    beforeEach(() => {
        mockRepository = createMockDeviceRepository();
        mockPhotoRepository = createMockPhotoRepository();
        computerService = new ComputerService(mockRepository, mockPhotoRepository, baseURL);
    });

    describe("getFrequentComputers", () => {
        it("should return list of frequent computers", async () => {
            const mockComputers = [createMockFrequentComputer(), createMockFrequentComputer()];
            mockRepository.getFrequentComputers = async () => mockComputers;

            const result = await computerService.getFrequentComputers({});

            expect(result).toEqual(mockComputers);
            expect(result.length).toBe(2);
        });

        it("should pass criteria to repository", async () => {
            const criteria = { limit: 10 };
            let capturedCriteria: any;

            mockRepository.getFrequentComputers = async (c) => {
                capturedCriteria = c;
                return [];
            };

            await computerService.getFrequentComputers(criteria);

            expect(capturedCriteria).toEqual(criteria);
        });
    });

    describe("getComputers", () => {
        it("should return list of computers", async () => {
            const mockComputers = [createMockComputer(), createMockComputer()];
            mockRepository.getComputers = async () => mockComputers;

            const result = await computerService.getComputers({});

            expect(result).toEqual(mockComputers);
            expect(result.length).toBe(2);
        });
    });

    describe("registerFrequentComputer", () => {
        it("should register a frequent computer with URLs", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "Dell",
                model: "Latitude",
                ownerName: "John Doe",
                ownerId: "123456",
                photo: mockPhoto
            };

            mockRepository.registerFrequentComputer = async (computer) => computer;

            const result = await computerService.registerFrequentComputer(request);

            expect(result.device.brand).toBe("Dell");
            expect(result.device.model).toBe("Latitude");
            expect(result.device.owner.name).toBe("John Doe");
            expect(result.device.owner.id).toBe("123456");
            expect(result.checkinURL).toBeDefined();
            expect(result.checkoutURL).toBeDefined();
            expect(result.checkinURL.toString()).toContain("/computers/frequent/checkin/");
            expect(result.checkoutURL.toString()).toContain("/devices/checkout/");
        });

        it("should handle computer without photo", async () => {
            const request = {
                brand: "HP",
                model: "EliteBook",
                ownerName: "Jane Smith",
                ownerId: "789012"
            };

            mockRepository.registerFrequentComputer = async (computer) => computer;

            const result = await computerService.registerFrequentComputer(request);

            expect(result.device.brand).toBe("HP");
            expect(result.device.photoURL).toBeUndefined();
        });
    });

    describe("checkinComputer", () => {
        it("should checkin computer with timestamp", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "Lenovo",
                model: "ThinkPad",
                ownerName: "Bob Wilson",
                ownerId: "456789",
                photo: mockPhoto
            };

            let savedComputer: any;
            mockRepository.checkinComputer = async (computer) => {
                savedComputer = computer;
                return computer;
            };

            const result = await computerService.checkinComputer(request);

            expect(result.brand).toBe("Lenovo");
            expect(result.checkinAt).toBeDefined();
            expect(result.checkinAt).toBeInstanceOf(Date);
            expect(savedComputer).toBeDefined();
        });
    });

    describe("checkinFrequentComputer", () => {
        it("should checkin existing frequent computer", async () => {
            const deviceId = "test-device-123";

            mockRepository.isFrequentComputerRegistered = async () => true;
            mockRepository.checkinFrequentComputer = async (id, datetime) => {
                return createMockFrequentComputer({
                    device: createMockComputer({ id, checkinAt: datetime })
                });
            };

            const result = await computerService.checkinFrequentComputer(deviceId);

            expect(result.device.id).toBe(deviceId);
            expect(result.device.checkinAt).toBeDefined();
        });

        it("should throw error when device not found", async () => {
            const deviceId = "non-existent-device";

            mockRepository.isFrequentComputerRegistered = async () => false;

            await expect(
                computerService.checkinFrequentComputer(deviceId)
            ).rejects.toThrow(SERVICE_ERRORS.DeviceNotFound);
        });
    });

    describe("generateComputerFromRequest", () => {
        it("should generate computer with photo", async () => {
            const mockPhoto = await createMockImageFile();
            const request = {
                brand: "Sony",
                model: "VAIO",
                color: "Silver",
                ownerName: "Alice Brown",
                ownerId: "111222",
                photo: mockPhoto
            };

            const result = await computerService.registerFrequentComputer(request);

            expect(result.device.brand).toBe("Sony");
            expect(result.device.model).toBe("VAIO");
            expect(result.device.color).toBe("Silver");
            expect(result.device.photoURL).toBeDefined();
            expect(result.device.photoURL?.toString()).toContain("blob.core.windows.net");
        });

        it("should validate request schema", async () => {
            const invalidRequest = {
                brand: "A", // Too short
                model: "Test",
                ownerName: "Test",
                ownerId: "123"
            };

            await expect(
                computerService.registerFrequentComputer(invalidRequest as any)
            ).rejects.toThrow();
        });
    });
});
