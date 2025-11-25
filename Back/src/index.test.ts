import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { SQLiteDeviceRepository } from "./adapter/repository/sql/sql.device-repository";
import { AzurePhotoRepository } from "./adapter/photo/azure";
import { ComputerService, DeviceService, MedicalDeviceService, DeviceHistoryService } from "./core/service";
import { ElysiaApiAdapter } from "./adapter/api/elysia";
import Elysia from "elysia";
import { unlinkSync } from "fs";

async function createTestImageFile(): Promise<File> {
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03,
    0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0x18, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ])
  return new File([pngBytes], "test.png", { type: "image/png" })
}

describe("Elysia Device API with Azure & SQLite", () => {
  let app: Elysia
  let deviceRepository: SQLiteDeviceRepository
  let photoRepository: AzurePhotoRepository
  let BASE_URL = ""
  let mockPhoto: File
  const TEST_DB_PATH = "./test-devices.db"

  beforeAll(async () => {
    // Inicializar repositorios con Azure y SQLite

    deviceRepository = new SQLiteDeviceRepository()
    photoRepository = new AzurePhotoRepository()

    const computerService = new ComputerService(
      deviceRepository,
      photoRepository,
      new URL("http://localhost:3000/api")
    )

    const deviceService = new DeviceService(deviceRepository)

    const medicalDeviceService = new MedicalDeviceService(
      deviceRepository,
      photoRepository
    )

    const deviceHistoryService = new DeviceHistoryService(deviceRepository)

    app = new ElysiaApiAdapter(
      computerService,
      deviceService,
      medicalDeviceService,
      deviceHistoryService
    ).app

    app.listen(3000)

    mockPhoto = await createTestImageFile()
    BASE_URL = `http://${app.server?.hostname}:${app.server?.port}/api`;
  });

  afterAll(async () => {
    app.stop()

    // Limpiar base de datos de test
    try {
      unlinkSync(TEST_DB_PATH)
      console.log("Test database cleaned up")
    } catch (error) {
      console.warn("Could not delete test database:", error)
    }
  });

  it("should register a new frequent computer and list it", async () => {
    const form = new FormData()

    form.append("brand", "Sony")
    form.append("model", "VAIO")
    form.append("ownerName", "Harry")
    form.append("ownerId", "123456")
    form.append("photo", mockPhoto)

    const createRes = await fetch(`${BASE_URL}/computers/frequent`, {
      method: "POST",
      body: form,
    });

    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created).toHaveProperty("device.id");
    expect(created.device.brand).toBe("Sony");
    expect(created.device.model).toBe("VAIO");
    expect(created.device.owner.name).toBe("Harry");
    expect(created.device.photoURL).toContain("blob.core.windows.net");

    const listRes = await fetch(`${BASE_URL}/computers/frequent`);

    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.some((c: any) => c.device.id === created.device.id)).toBe(true);
  });

  it("should check-in a computer and find it in the computer list", async () => {
    const form = new FormData()

    form.append("brand", "Dell")
    form.append("model", "Latitude")
    form.append("ownerName", "Alice")
    form.append("ownerId", "A123456")
    form.append("photo", mockPhoto)

    const checkinRes = await fetch(`${BASE_URL}/computers/checkin`, {
      method: "POST",
      body: form,
    });
    expect(checkinRes.status).toBe(200);
    const checked = await checkinRes.json();
    expect(checked).toHaveProperty("id");
    expect(checked.brand).toBe("Dell");
    expect(checked.model).toBe("Latitude");
    expect(checked.photoURL).toContain("blob.core.windows.net");

    const listRes = await fetch(`${BASE_URL}/computers`);
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.some((c: any) => c.id === checked.id)).toBe(true);
  });

  it("should check-in a medical device and list it", async () => {
    const form = new FormData()

    form.append("brand", "GE")
    form.append("model", "ECG1000")
    form.append("ownerName", "Dr. House")
    form.append("ownerId", "123512464")
    form.append("photo", mockPhoto)
    form.append("serial", "f48238r7y2r")

    const checkinRes = await fetch(`${BASE_URL}/medicaldevices/checkin`, {
      method: "POST",
      body: form,
    });
    expect(checkinRes.status).toBe(200);
    const created = await checkinRes.json();
    expect(created).toHaveProperty("id");
    expect(created.brand).toBe("GE");
    expect(created.serial).toBe("f48238r7y2r");
    expect(created.photoURL).toContain("blob.core.windows.net");

    const listRes = await fetch(`${BASE_URL}/medicaldevices`);
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list.some((m: any) => m.id === created.id)).toBe(true);
  });

  it("should list entered devices after check-ins", async () => {
    const listRes = await fetch(`${BASE_URL}/devices/entered`);
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("should checkin and checkout a frequent computer successfully", async () => {
    const form = new FormData()

    form.append("brand", "HP")
    form.append("model", "Elitebook")
    form.append("ownerName", "Bob Salas")
    form.append("ownerId", "001123132")
    form.append("photo", mockPhoto)

    const registerRes = await fetch(`${BASE_URL}/computers/frequent`, {
      method: "POST",
      body: form,
    });

    expect(registerRes.status).toBe(200);
    const frequentComputer = await registerRes.json();
    expect(frequentComputer).toHaveProperty("checkinURL");
    expect(frequentComputer).toHaveProperty("checkoutURL");

    const checkinRes = await fetch(frequentComputer.checkinURL, {
      method: "PATCH",
    });
    expect(checkinRes.status).toBe(200);
    const checkedIn = await checkinRes.json();
    expect(checkedIn.device.checkinAt).toBeDefined();

    const checkoutRes = await fetch(frequentComputer.checkoutURL, {
      method: "PATCH",
    });
    expect(checkoutRes.status).toBe(200);
  });

  it("should persist data in SQLite across operations", async () => {
    // Verificar que los datos persisten consultando directamente
    const computers = await deviceRepository.getComputers({});
    expect(computers.length).toBeGreaterThan(0);

    const medicalDevices = await deviceRepository.getMedicalDevices({});
    expect(medicalDevices.length).toBeGreaterThan(0);

    const frequentComputers = await deviceRepository.getFrequentComputers({});
    expect(frequentComputers.length).toBeGreaterThan(0);
  });

  it("should upload photos to Azure Blob Storage", async () => {
    const form = new FormData()

    form.append("brand", "Lenovo")
    form.append("model", "ThinkPad")
    form.append("ownerName", "John Doe")
    form.append("ownerId", "JD001")
    form.append("photo", mockPhoto)

    const checkinRes = await fetch(`${BASE_URL}/computers/checkin`, {
      method: "POST",
      body: form,
    });

    expect(checkinRes.status).toBe(200);
    const computer = await checkinRes.json();

    // Verificar que la URL de la foto es de Azure
    expect(computer.photoURL).toContain("blob.core.windows.net");
    expect(computer.photoURL).toContain("pds006"); // Nombre de la cuenta de storage

    // Intentar acceder a la foto (debería ser accesible públicamente)
    const photoRes = await fetch(computer.photoURL);
    expect(photoRes.status).toBe(200);
    expect(photoRes.headers.get("content-type")).toContain("image");
  });
});