import { ComputerService, DeviceService, MedicalDeviceService, DeviceHistoryService } from "@/core/service";
import { Controller } from "./controller.elysia";
import openapi from "@elysiajs/openapi";
import Elysia from "elysia";
import { cors } from "@elysiajs/cors"; // 👈 Importa el plugin de CORS

export class ElysiaApiAdapter {
    private controller: Controller;
    public app: Elysia;

    constructor(
        computerService: ComputerService,
        deviceService: DeviceService,
        medicalDeviceService: MedicalDeviceService,
        deviceHistoryService: DeviceHistoryService
    ) {
        this.controller = new Controller(
            computerService,
            deviceService,
            medicalDeviceService,
            deviceHistoryService
        );

        this.app = new Elysia()
            .use(cors({
                origin: "http://localhost:5173", // 👈 Permite peticiones desde tu frontend
                methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // 👈 PATCH agregado
                credentials: true, // 👈 Permite envío de cookies
                allowedHeaders: ["Content-Type", "Authorization"]
            }))
            .use(openapi({}))
            .get("/", () => "Servidor funcionando correctamente 🚀")
            .use(this.controller.routes());
    }

    async run() {
        this.app.listen(3000);
        console.log("✅ El servidor está corriendo en el puerto 3000");
    }
}
