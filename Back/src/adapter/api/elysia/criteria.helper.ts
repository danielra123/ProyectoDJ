import { DeviceCriteria, DeviceFilterQuery, DeviceSortQuery, newDeviceCriteria } from '@/core/domain'
import * as z from 'zod'

const QUERY_PARAM_KEYS_SCHEMA = z.union([
  z.templateLiteral([ "filter[", z.string(), "]"]),
  z.literal("sort"),
  z.literal("limit"),
  z.literal("offset"),
  z.literal("search")
])

export const CRITERIA_QUERY_PARAMS_SCHEMA = z.record(QUERY_PARAM_KEYS_SCHEMA, z.unknown())

export type CriteriaQueryParams = z.infer<typeof CRITERIA_QUERY_PARAMS_SCHEMA>

const filterKeyRegex = /^filter\[(.+?)\]$/

export class CriteriaHelper {
  static parseFromQuery(queryParams: CriteriaQueryParams): DeviceCriteria {
    const criteria = newDeviceCriteria()
    const filters: DeviceFilterQuery[] = []

    for (const key in queryParams) {
      const filter = this.parseFilterFromEntry(key, queryParams[key])
      if (filter) {
        filters.push(filter)
      }

      const sort = this.parseSortFromEntry(key, queryParams[key])
      if (sort) {
        criteria.sortBy = sort
      }

      if (key === "limit" && typeof queryParams[key] === "string") {
        criteria.limit = parseInt(queryParams[key] as string, 10)
      }

      if (key === "offset" && typeof queryParams[key] === "string") {
        criteria.offset = parseInt(queryParams[key] as string, 10)
      }

      if (key === "search" && typeof queryParams[key] === "string") {
        criteria.search = queryParams[key] as string
      }
    }

    if (filters.length > 0) {
      criteria.filterBy = filters[0]
    }

    return criteria
  }

  private static parseFilterFromEntry(
    key: string,
    value: unknown
  ): DeviceFilterQuery | undefined {
    const separatedKey = key.match(filterKeyRegex)
    if (!separatedKey) return undefined

    const field = separatedKey[1]

    return {
      field,
      value
    }
  }

  private static parseSortFromEntry(
    key: string,
    value: unknown
  ): DeviceSortQuery | undefined {
    if (key !== "sort") return undefined
    if (typeof value !== "string") return undefined

    const isDescending = value.startsWith("-")

    // Remove '-' if present
    const field = isDescending ? value.substring(1) : value

    return {
      field,
      isAscending: !isDescending,
    }
  }
}
