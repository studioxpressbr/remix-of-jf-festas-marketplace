import { Link } from 'react-router-dom';
import { VENDOR_CATEGORIES } from '@/lib/constants';

interface Vendor {
  id: string;
  profile_id: string;
  business_name: string;
  slug?: string | null;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
}

interface VendorThumbnailProps {
  vendor: Vendor;
}

export function VendorThumbnail({ vendor }: VendorThumbnailProps) {
  const categoryInfo = VENDOR_CATEGORIES.find((c) => c.value === vendor.category);
  const firstImage = vendor.images?.[0] || null;

  return (
    <Link 
      to={vendor.slug ? `/fornecedor/${vendor.slug}` : `/vendor/${vendor.profile_id}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
        {firstImage ? (
          <img
            src={firstImage}
            alt={vendor.business_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-champagne">
            <span className="text-5xl">{categoryInfo?.emoji || '🎉'}</span>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
        
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-2 font-display text-sm font-semibold text-primary-foreground sm:text-base">
            {vendor.business_name}
          </h3>
          {vendor.neighborhood && (
            <p className="mt-0.5 text-xs text-primary-foreground/80">
              {vendor.neighborhood}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
