import { DeviceHistoryEntry, DeviceHistoryFilters } from "@core/domain"
import { DeviceRepository } from "@core/repository"

export class DeviceHistoryService {
  constructor(private deviceRepository: DeviceRepository) {}

  async getHistory(filters?: DeviceHistoryFilters): Promise<DeviceHistoryEntry[]> {
    return this.deviceRepository.getDeviceHistory(filters)
  }
}
