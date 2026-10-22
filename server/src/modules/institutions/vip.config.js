/**
 * VIP Service Configuration & Business Logic — Phase 1
 *
 * Rules:
 * - Initial VIP fee: 1,000 ETB per service.
 * - Currency: "ETB".
 * - VIP is available by default for every active service whose associated provider is also active.
 * - VIP fee is independent of normal service fee (estimatedFee).
 *
 * This module isolates application-level defaults so that subsequent phases can
 * introduce database-backed VIP configurations without redesigning existing service architecture.
 */

export const VIP_CONFIG = Object.freeze({
  DEFAULT_FEE: 1000,
  DEFAULT_CURRENCY: "ETB",
});

/**
 * Resolves VIP availability and fee details for a service.
 *
 * @param {Object} service - Service entity with isActive flag
 * @param {boolean|Object} [providerOrActive=true] - Parent provider instance or boolean indicating if provider is active
 * @returns {{ vipAvailable: boolean, vipFee: number, currency: string }}
 */
export function getVipServiceConfig(service, providerOrActive = true) {
  const isServiceActive = service?.isActive !== undefined ? Boolean(service.isActive) : true;

  let isProviderActive = true;
  if (typeof providerOrActive === "boolean") {
    isProviderActive = providerOrActive;
  } else if (providerOrActive && typeof providerOrActive === "object") {
    isProviderActive = providerOrActive.isActive !== undefined ? Boolean(providerOrActive.isActive) : true;
  } else if (service?.provider && typeof service.provider === "object") {
    isProviderActive = service.provider.isActive !== undefined ? Boolean(service.provider.isActive) : true;
  }

  const vipAvailable = isServiceActive && isProviderActive;

  return {
    vipAvailable,
    vipFee: VIP_CONFIG.DEFAULT_FEE,
    currency: VIP_CONFIG.DEFAULT_CURRENCY,
  };
}
