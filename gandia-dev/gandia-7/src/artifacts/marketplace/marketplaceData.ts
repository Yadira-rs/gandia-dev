/**
 * marketplaceData.ts
 * Solo re-exporta tipos desde useMarketplace para compatibilidad
 * con los widgets que importan de este archivo.
 *
 * Los DATOS reales vienen de Supabase via useMarketplace.ts
 *
 * ARCHIVO → src/artifacts/marketplace/marketplaceData.ts
 */

export type {
    PartnerId,
    PartnerDB as MarketplacePartner,
    ProductDB as MarketplaceProduct,
    CompatibilidadDB,
    EquipamientoDB,
    PartnerConProductos,
} from '../../hooks/useMarketplace'

export { NECESIDADES } from '../../hooks/useMarketplace'