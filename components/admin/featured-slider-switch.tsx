// components/admin/featured-slider-switch.tsx
'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toggleFeaturedSlider } from '@/app/[lang]/admin/(dashboard)/actions';

type Props = {
  id: string;
  table: 'series' | 'movies' | 'programs';
  defaultChecked: boolean;
  title: string;
  disabled?: boolean;
};

export function FeaturedSliderSwitch({
  id,
  table,
  defaultChecked,
  title,
  disabled = false,
}: Props) {
  const [checked, setChecked] = React.useState(defaultChecked);
  const [isPending, startTransition] = React.useTransition();
  const switchId = React.useId();

  function onCheckedChange(next: boolean) {
    const previous = checked;
    setChecked(next); // optimistic

    startTransition(async () => {
      const res = await toggleFeaturedSlider({ table, id, value: next });

      if (!res.ok) {
        setChecked(previous); // rollback
        toast.error('Update failed', {
          description: res.error === 'FORBIDDEN' ? 'Insufficient permissions.' : res.error,
        });
        return;
      }

      toast.success(next ? 'Added to hero slider' : 'Removed from hero slider', {
        description: title,
      });
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || isPending}
        aria-label={`Feature ${title} in the hero slider`}
        className="data-[state=checked]:bg-primary"
      />
      <Label
        htmlFor={switchId}
        className={cn(
          'cursor-pointer select-none text-sm transition-colors',
          checked ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        Hero slider
      </Label>
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
