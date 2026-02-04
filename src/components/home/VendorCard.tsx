import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Ticket } from 'lucide-react';
import { VENDOR_CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/ui/star-rating';

interface Vendor {
  id: string;
  profile_id: string;
  business_name: string;
  category: string;
  description: string | null;
  neighborhood: string | null;
  images: string[] | null;
  active_coupons_count?: number;
  avg_rating?: number;
  review_count?: number;
}

interface VendorCardProps {
  vendor: Vendor;
  index: number;
}

export const VendorCard = React.forwardRef<HTMLAnchorElement, VendorCardProps>(
  ({ vendor, index }, ref) => {
    const categoryInfo = VENDOR_CATEGORIES.find((c) => c.value === vendor.category);
    const randomImage = vendor.images?.[Math.floor(Math.random() * (vendor.images?.length || 1))] || null;

    // Create varying heights for masonry effect
    const heights = ['h-64', 'h-72', 'h-80', 'h-64', 'h-72'];
    const heightClass = heights[index % heights.length];

    const hasCoupons = (vendor.active_coupons_count ?? 0) > 0;
    const hasRating = (vendor.avg_rating ?? 0) > 0;

    return (
      <Link ref={ref} to={`/vendor/${vendor.profile_id}`}>
        <Card className="group overflow-hidden border-0 bg-gradient-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
          <div className={cn('relative overflow-hidden', heightClass)}>
            {randomImage ? (
              <img
                src={randomImage}
                alt={vendor.business_name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-champagne">
                <span className="text-6xl">{categoryInfo?.emoji || '🎉'}</span>
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            
            {/* Top badges row */}
            <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
              {/* Category badge */}
              <Badge
                className={cn(
                  'border-0',
                  CATEGORY_COLORS[vendor.category] || 'bg-muted text-muted-foreground'
                )}
              >
                {categoryInfo?.emoji} {categoryInfo?.label}
              </Badge>
              
              {/* Coupon badge */}
              {hasCoupons && (
                <Badge className="border-0 bg-emerald-500 text-white">
                  <Ticket className="mr-1 h-3 w-3" />
                  Cupom
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-lg font-semibold text-primary-foreground">
              {vendor.business_name}
            </h3>
            
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {vendor.neighborhood && (
                <p className="flex items-center gap-1 text-sm text-primary-foreground/80">
                  <MapPin className="h-3 w-3" />
                  {vendor.neighborhood}
                </p>
              )}
              
              {hasRating && (
                <StarRating
                  rating={vendor.avg_rating ?? 0}
                  reviewCount={vendor.review_count}
                  size="sm"
                  className="text-primary-foreground/90 [&_svg]:text-amber-400 [&_svg]:fill-amber-400 [&_.text-muted-foreground]:text-primary-foreground/70"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
);
VendorCard.displayName = "VendorCard";
