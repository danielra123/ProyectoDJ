import { describe, expect, it, beforeEach } from "bun:test";
import { Helper } from "./helper";

describe("Helper", () => {
    describe("generateDeviceId", () => {
        it("should generate a valid UUID", () => {
            const id = Helper.generateDeviceId();

            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(id).toMatch(uuidRegex);
        });

        it("should generate unique IDs", () => {
            const id1 = Helper.generateDeviceId();
            const id2 = Helper.generateDeviceId();

            expect(id1).not.toBe(id2);
        });
    });

    describe("getFrequentCheckinURL", () => {
        it("should generate correct checkin URL", () => {
            const deviceId = "test-device-123";
            const baseURL = new URL("http://localhost:3000/api");

            const url = Helper.getFrequentCheckinURL(deviceId, baseURL);

            expect(url.toString()).toBe("http://localhost:3000/api/computers/frequent/checkin/test-device-123");
        });

        it("should work with different base URLs", () => {
            const deviceId = "device-456";
            const baseURL = new URL("https://example.com/api/v1");

            const url = Helper.getFrequentCheckinURL(deviceId, baseURL);

            expect(url.toString()).toBe("https://example.com/api/computers/frequent/checkin/device-456");
        });
    });

    describe("getFrequentCheckoutURL", () => {
        it("should generate correct checkout URL", () => {
            const deviceId = "test-device-789";
            const baseURL = new URL("http://localhost:3000/api");

            const url = Helper.getFrequentCheckoutURL(deviceId, baseURL);

            expect(url.toString()).toBe("http://localhost:3000/api/devices/checkout/test-device-789");
        });

        it("should work with different base URLs", () => {
            const deviceId = "device-xyz";
            const baseURL = new URL("https://production.com/api");

            const url = Helper.getFrequentCheckoutURL(deviceId, baseURL);

            expect(url.toString()).toBe("https://production.com/api/devices/checkout/device-xyz");
        });
    });
});
