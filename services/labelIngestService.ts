import { Package, PackageStatus } from "../types"
import { lockerMap } from "../data/lockerMap"

export function ingestLabel(payload: string): Package {
  const base: Package = {
    id: crypto.randomUUID(),
    shipmentId: undefined,
    address: undefined,
    coords: undefined,
    locationConfidence: 0,
    // Defaults required for app functionality
    priority: false,
    status: PackageStatus.PENDING
  }

  const locker = payload.match(/PACZKOMAT_[A-Z0-9]+/)
  if (locker && lockerMap[locker[0]]) {
    return { ...base, coords: lockerMap[locker[0]], locationConfidence: 1 }
  }

  if (looksLikeAddress(payload)) {
    return { ...base, address: normalizeAddress(payload), locationConfidence: 0.5 }
  }

  return { ...base, shipmentId: payload, locationConfidence: 0 }
}

function looksLikeAddress(t: string): boolean {
  const hasPostal = /\d{2}-\d{3}/.test(t)
  const hasStreet = /(ul\.|ulica|al\.|aleja|pl\.|plac)/i.test(t)
  return hasPostal && hasStreet
}

function normalizeAddress(t: string): string {
  return t.replace(/\s+/g, " ").trim()
}