import { DeviceBrand, DeviceId, DeviceModel, DeviceOwner } from "./shared.domain"

export type DeviceHistoryEvent = "checkin" | "checkout"

export type DeviceHistoryEntry = {
  id: string
  deviceId: DeviceId
  deviceType: "computer" | "frequent-computer" | "medical-device"
  brand: DeviceBrand
  model: DeviceModel
  owner: DeviceOwner
  event: DeviceHistoryEvent
  eventDate: Date
  serial?: string
  color?: string
}

export type DeviceHistoryFilters = {
  deviceType?: "computer" | "frequent-computer" | "medical-device"
  event?: DeviceHistoryEvent
  startDate?: Date
  endDate?: Date
  ownerId?: string
}
