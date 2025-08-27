'use client';

import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem } from '@/components/ui/form/Dropdown';
import { cn } from '@/utils/styles';
import { ChevronDown } from 'lucide-react';
import type { ListVisibility } from '@/types/userList';

interface UserListFiltersProps {
  currentVisibility?: ListVisibility;
  onVisibilityChange: (visibility: ListVisibility | undefined) => void;
  currentSort?: string;
  onSortChange?: (sort: string) => void;
  className?: string;
}

export const UserListFilters = ({
  currentVisibility,
  onVisibilityChange,
  currentSort = 'recently_updated',
  onSortChange,
  className,
}: UserListFiltersProps) => {
  const getVisibilityLabel = (visibility: ListVisibility) => {
    switch (visibility) {
      case 'PRIVATE':
        return 'Private';
      case 'SHARED':
        return 'Shared';
      case 'PUBLIC':
        return 'Public';
      default:
        return 'All Lists';
    }
  };

  const handleVisibilityChange = (value: string) => {
    if (value === 'all') {
      onVisibilityChange(undefined);
    } else {
      onVisibilityChange(value as ListVisibility);
    }
  };

  const handleSortChange = (value: string) => {
    if (onSortChange) {
      onSortChange(value);
    }
  };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'recently_updated':
        return 'Recently Updated';
      case 'recently_created':
        return 'Recently Created';
      case 'name_az':
        return 'Name A-Z';
      case 'most_items':
        return 'Most Items';
      default:
        return 'Recently Updated';
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        <Dropdown
          trigger={
            <div className="flex items-center justify-between w-48 px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <span>{currentVisibility ? getVisibilityLabel(currentVisibility) : 'All Lists'}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          }
        >
          <DropdownItem onClick={() => handleVisibilityChange('all')}>All Lists</DropdownItem>
          <DropdownItem onClick={() => handleVisibilityChange('PRIVATE')}>Private</DropdownItem>
          <DropdownItem onClick={() => handleVisibilityChange('SHARED')}>Shared</DropdownItem>
          <DropdownItem onClick={() => handleVisibilityChange('PUBLIC')}>Public</DropdownItem>
        </Dropdown>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        <Dropdown
          trigger={
            <div className="flex items-center justify-between w-40 px-3 py-2 border border-gray-200 rounded-lg bg-white">
              <span>{getSortLabel(currentSort)}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          }
        >
          <DropdownItem onClick={() => handleSortChange('recently_updated')}>
            Recently Updated
          </DropdownItem>
          <DropdownItem onClick={() => handleSortChange('recently_created')}>
            Recently Created
          </DropdownItem>
          <DropdownItem onClick={() => handleSortChange('name_az')}>Name A-Z</DropdownItem>
          <DropdownItem onClick={() => handleSortChange('most_items')}>Most Items</DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
};
