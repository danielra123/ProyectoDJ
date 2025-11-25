import { Database } from "bun:sqlite"
import {
  Computer,
  DeviceId,
  FrequentComputer,
  DeviceCriteria,
  MedicalDevice,
  EnteredDevice,
  DeviceHistoryEntry,
  DeviceHistoryFilters
} from "@core/domain"
import { DeviceRepository } from "@core/repository/device.repository"

// Repositorio SQLite para persistencia real
export class SQLiteDeviceRepository implements DeviceRepository {
  private db: Database
  private BASE_URL = "http://localhost:3000/" // Cambia si usas otro host o puerto

  constructor() {
    this.db = new Database("devices.db")

    // Crear tabla de computadoras
    this.db.run(`
      CREATE TABLE IF NOT EXISTS computers (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        color TEXT,
        owner_name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        photo_url TEXT,
        checkin_at TEXT,
        checkout_at TEXT,
        updated_at TEXT NOT NULL
      )
    `)

    // Crear tabla de equipos frecuentes
    this.db.run(`
      CREATE TABLE IF NOT EXISTS frequent_computers (
        id TEXT PRIMARY KEY,
        computer_id TEXT NOT NULL,
        checkin_url TEXT,
        checkout_url TEXT,
        FOREIGN KEY(computer_id) REFERENCES computers(id)
      )
    `)

    // Crear tabla de dispositivos médicos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS medical_devices (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        serial TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        checkin_at TEXT,
        checkout_at TEXT,
        updated_at TEXT NOT NULL
      )
    `)

    // Crear tabla de historial de dispositivos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS device_history (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        device_type TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        event TEXT NOT NULL,
        event_date TEXT NOT NULL,
        serial TEXT,
        color TEXT
      )
    `)
  }

  // -----------------------------
  // ✅ Método auxiliar para registrar en historial
  // -----------------------------
  private addToHistory(entry: {
    deviceId: string
    deviceType: "computer" | "frequent-computer" | "medical-device"
    brand: string
    model: string
    ownerName: string
    ownerId: string
    event: "checkin" | "checkout"
    eventDate: Date
    serial?: string
    color?: string
  }) {
    const historyId = crypto.randomUUID()
    const stmt = this.db.prepare(`
      INSERT INTO device_history (
        id, device_id, device_type, brand, model, owner_name, owner_id,
        event, event_date, serial, color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      historyId,
      entry.deviceId,
      entry.deviceType,
      entry.brand,
      entry.model,
      entry.ownerName,
      entry.ownerId,
      entry.event,
      entry.eventDate.toISOString(),
      entry.serial ?? null,
      entry.color ?? null
    )
  }

  // -----------------------------
  // ✅ Check-in de computadora
  // -----------------------------
  async checkinComputer(computer: Computer): Promise<Computer> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO computers (
        id, brand, model, color, owner_name, owner_id, photo_url,
        checkin_at, checkout_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      computer.id,
      computer.brand,
      computer.model,
      computer.color ?? null,
      computer.owner.name,
      computer.owner.id,
      computer.photoURL?.href ?? null,
      computer.checkinAt?.toISOString() ?? null,
      computer.checkoutAt?.toISOString() ?? null,
      computer.updatedAt.toISOString()
    )

    // Registrar en historial
    if (computer.checkinAt) {
      this.addToHistory({
        deviceId: computer.id,
        deviceType: "computer",
        brand: computer.brand,
        model: computer.model,
        ownerName: computer.owner.name,
        ownerId: computer.owner.id,
        event: "checkin",
        eventDate: computer.checkinAt,
        color: computer.color
      })
    }

    return computer
  }

  // -----------------------------
  // ✅ Obtener computadoras
  // -----------------------------
  async getComputers(_criteria: DeviceCriteria): Promise<Computer[]> {
    const rows = this.db.query("SELECT * FROM computers").all()

    return rows.map((r: any) => ({
      id: r.id,
      brand: r.brand,
      model: r.model,
      color: r.color ?? undefined,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
      },
      photoURL: r.photo_url
        ? new URL(r.photo_url, this.BASE_URL)
        : undefined,
      checkinAt: r.checkin_at ? new Date(r.checkin_at) : undefined,
      checkoutAt: r.checkout_at ? new Date(r.checkout_at) : undefined,
      updatedAt: new Date(r.updated_at),
    }))
  }

  // -----------------------------
  // ✅ Registrar equipo frecuente
  // -----------------------------
  async registerFrequentComputer(
    computer: FrequentComputer
  ): Promise<FrequentComputer> {
    // Primero insertar la computadora si no existe
    await this.checkinComputer(computer.device)
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO frequent_computers (
        id, computer_id, checkin_url, checkout_url
      ) VALUES (?, ?, ?, ?)
    `)

    stmt.run(
      computer.device.id,
      computer.device.id,
      computer.checkinURL?.href ?? null,
      computer.checkoutURL?.href ?? null
    )

    return computer
  }

  // -----------------------------
  // ✅ Obtener equipos frecuentes
  // -----------------------------
  async getFrequentComputers(_criteria: DeviceCriteria): Promise<FrequentComputer[]> {
    const rows = this.db.query(`
      SELECT f.id AS f_id, f.checkin_url, f.checkout_url,
             c.id AS c_id, c.brand, c.model, c.color, c.owner_id, c.owner_name,
             c.photo_url, c.checkin_at, c.checkout_at, c.updated_at
      FROM frequent_computers f
      JOIN computers c ON f.computer_id = c.id
    `).all()

    return rows.map((r: any) => ({
      device: {
        id: r.c_id,
        brand: r.brand,
        model: r.model,
        color: r.color ?? undefined,
        owner: {
          id: r.owner_id,
          name: r.owner_name,
        },
        photoURL: r.photo_url
          ? new URL(r.photo_url, this.BASE_URL)
          : undefined,
        checkinAt: r.checkin_at ? new Date(r.checkin_at) : undefined,
        checkoutAt: r.checkout_at ? new Date(r.checkout_at) : undefined,
        updatedAt: new Date(r.updated_at),
      },
      checkinURL: r.checkin_url
        ? new URL(r.checkin_url, this.BASE_URL)
        : undefined,
      checkoutURL: r.checkout_url
        ? new URL(r.checkout_url, this.BASE_URL)
        : undefined,
    }))
  }

  // -----------------------------
  // ✅ Check-in frecuente
  // -----------------------------
  async checkinFrequentComputer(
    id: DeviceId,
    datetime: Date
  ): Promise<FrequentComputer> {
    const computer = this.db
      .query("SELECT * FROM computers WHERE id = ?")
      .get(id) as any

    if (!computer) throw new Error(`Computer ${id} not found`)

    this.db.run("UPDATE computers SET checkin_at = ?, checkout_at = NULL WHERE id = ?", [
      datetime.toISOString(),
      id,
    ])

    // Registrar en historial
    this.addToHistory({
      deviceId: computer.id,
      deviceType: "frequent-computer",
      brand: computer.brand,
      model: computer.model,
      ownerName: computer.owner_name,
      ownerId: computer.owner_id,
      event: "checkin",
      eventDate: datetime,
      color: computer.color
    })

    const freq = this.db
      .query("SELECT * FROM frequent_computers WHERE id = ?")
      .get(id) as any

    return {
      device: {
        id: computer.id,
        brand: computer.brand,
        model: computer.model,
        color: computer.color ?? undefined,
        owner: {
          id: computer.owner_id,
          name: computer.owner_name,
        },
        photoURL: computer.photo_url
          ? new URL(computer.photo_url, this.BASE_URL)
          : undefined,
        checkinAt: datetime,
        updatedAt: new Date(),
      },
      checkinURL: freq?.checkin_url
        ? new URL(freq.checkin_url, this.BASE_URL)
        : undefined,
      checkoutURL: freq?.checkout_url
        ? new URL(freq.checkout_url, this.BASE_URL)
        : undefined,
    }
  }

  // -----------------------------
  // ✅ Dispositivos médicos
  // -----------------------------
  async getMedicalDevices(_criteria: DeviceCriteria): Promise<MedicalDevice[]> {
    const rows = this.db.query("SELECT * FROM medical_devices").all()

    return rows.map((r: any) => ({
      id: r.id,
      brand: r.brand,
      model: r.model,
      serial: r.serial,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
      },
      photoURL: new URL(r.photo_url, this.BASE_URL),
      checkinAt: r.checkin_at ? new Date(r.checkin_at) : undefined,
      checkoutAt: r.checkout_at ? new Date(r.checkout_at) : undefined,
      updatedAt: new Date(r.updated_at),
    }))
  }

  async checkinMedicalDevice(device: MedicalDevice): Promise<MedicalDevice> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO medical_devices (
        id, brand, model, serial, owner_name, owner_id, photo_url,
        checkin_at, checkout_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      device.id,
      device.brand,
      device.model,
      device.serial,
      device.owner.name,
      device.owner.id,
      device.photoURL.href,
      device.checkinAt?.toISOString() ?? null,
      device.checkoutAt?.toISOString() ?? null,
      device.updatedAt.toISOString()
    )

    // Registrar en historial
    if (device.checkinAt) {
      this.addToHistory({
        deviceId: device.id,
        deviceType: "medical-device",
        brand: device.brand,
        model: device.model,
        ownerName: device.owner.name,
        ownerId: device.owner.id,
        event: "checkin",
        eventDate: device.checkinAt,
        serial: device.serial
      })
    }

    return device
  }

  // -----------------------------
  // ✅ Dispositivos ingresados
  // -----------------------------
  async getEnteredDevices(_criteria: DeviceCriteria): Promise<EnteredDevice[]> {
    const computers = this.db.query(`
      SELECT id, brand, model, owner_name, owner_id, checkin_at, checkout_at, updated_at, 
             'computer' as type, NULL as serial
      FROM computers 
      WHERE checkin_at IS NOT NULL AND checkout_at IS NULL
    `).all()

    const medicalDevices = this.db.query(`
      SELECT id, brand, model, owner_name, owner_id, checkin_at, checkout_at, updated_at, 
             'medical-device' as type, serial
      FROM medical_devices 
      WHERE checkin_at IS NOT NULL AND checkout_at IS NULL
    `).all()

    const allDevices = [...computers, ...medicalDevices]

    return allDevices.map((r: any) => ({
      id: r.id,
      brand: r.brand,
      model: r.model,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
      },
      checkinAt: r.checkin_at ? new Date(r.checkin_at) : undefined,
      checkoutAt: r.checkout_at ? new Date(r.checkout_at) : undefined,
      updatedAt: new Date(r.updated_at),
      type: r.type as "computer" | "medical-device",
      ...(r.serial && { serial: r.serial })
    })) as EnteredDevice[]
  }

  // -----------------------------
  // ✅ Checkout de dispositivo
  // -----------------------------
  async checkoutDevice(id: DeviceId, datetime: Date): Promise<void> {
    // Verificar si es computadora
    const computer = this.db
      .query("SELECT * FROM computers WHERE id = ?")
      .get(id) as any

    if (computer) {
      this.db.run("UPDATE computers SET checkout_at = ? WHERE id = ?", [
        datetime.toISOString(),
        id,
      ])

      // Verificar si es frecuente
      const isFrequent = this.db
        .query("SELECT id FROM frequent_computers WHERE id = ?")
        .get(id)

      // Registrar en historial
      this.addToHistory({
        deviceId: computer.id,
        deviceType: isFrequent ? "frequent-computer" : "computer",
        brand: computer.brand,
        model: computer.model,
        ownerName: computer.owner_name,
        ownerId: computer.owner_id,
        event: "checkout",
        eventDate: datetime,
        color: computer.color
      })
      return
    }

    // Verificar si es dispositivo médico
    const medical = this.db
      .query("SELECT * FROM medical_devices WHERE id = ?")
      .get(id) as any

    if (medical) {
      this.db.run("UPDATE medical_devices SET checkout_at = ? WHERE id = ?", [
        datetime.toISOString(),
        id,
      ])

      // Registrar en historial
      this.addToHistory({
        deviceId: medical.id,
        deviceType: "medical-device",
        brand: medical.brand,
        model: medical.model,
        ownerName: medical.owner_name,
        ownerId: medical.owner_id,
        event: "checkout",
        eventDate: datetime,
        serial: medical.serial
      })
    }
  }

  // -----------------------------
  // ✅ Consultas auxiliares
  // -----------------------------
  async isDeviceEntered(id: DeviceId): Promise<boolean> {
    const computer = this.db
      .query("SELECT checkin_at, checkout_at FROM computers WHERE id = ?")
      .get(id) as any
      
    if (computer && computer.checkin_at && !computer.checkout_at) return true
    
    const medical = this.db
      .query("SELECT checkin_at, checkout_at FROM medical_devices WHERE id = ?")
      .get(id) as any
      
    if (medical && medical.checkin_at && !medical.checkout_at) return true
    
    return false
  }

  async isFrequentComputerRegistered(id: DeviceId): Promise<boolean> {
    const row = this.db
      .query("SELECT id FROM frequent_computers WHERE id = ?")
      .get(id)
    return !!row
  }

  // -----------------------------
  // ✅ Obtener historial de dispositivos
  // -----------------------------
  async getDeviceHistory(filters?: DeviceHistoryFilters): Promise<DeviceHistoryEntry[]> {
    let sql = "SELECT * FROM device_history WHERE 1=1"
    const params: any[] = []

    if (filters?.deviceType) {
      sql += " AND device_type = ?"
      params.push(filters.deviceType)
    }

    if (filters?.event) {
      sql += " AND event = ?"
      params.push(filters.event)
    }

    if (filters?.startDate) {
      sql += " AND event_date >= ?"
      params.push(filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      sql += " AND event_date <= ?"
      params.push(filters.endDate.toISOString())
    }

    if (filters?.ownerId) {
      sql += " AND owner_id = ?"
      params.push(filters.ownerId)
    }

    sql += " ORDER BY event_date DESC"

    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as any[]

    return rows.map((r: any) => ({
      id: r.id,
      deviceId: r.device_id,
      deviceType: r.device_type as "computer" | "frequent-computer" | "medical-device",
      brand: r.brand,
      model: r.model,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
      },
      event: r.event as "checkin" | "checkout",
      eventDate: new Date(r.event_date),
      ...(r.serial && { serial: r.serial }),
      ...(r.color && { color: r.color })
    }))
  }
}