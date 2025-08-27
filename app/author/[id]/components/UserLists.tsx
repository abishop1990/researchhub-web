'use client';

import { useState } from 'react';
import { useUserLists } from '@/hooks/useUserLists';
import { UserListCard } from '@/components/UserLists/UserListCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, Plus } from 'lucide-react';
import { CreateListModal } from '@/components/UserLists/CreateListModal';
import { UserListFilters } from '@/components/UserLists/UserListFilters';
import type { ListVisibility } from '@/types/userList';

interface UserListsProps {
  authorId: number;
  isOwnProfile: boolean;
}

export const UserLists = ({ authorId, isOwnProfile }: UserListsProps) => {
  // This component should only be used on the user's own profile
  // The authorId and isOwnProfile props are kept for interface compatibility
  // but the component assumes it's always the user's own profile
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState<ListVisibility | undefined>(undefined);
  const [currentSort, setCurrentSort] = useState('recently_updated');

  // Only use useUserLists since this component should only be shown on own profile
  const { lists, isLoading, error, hasMore, loadMore, createList, fetchLists } =
    useUserLists(currentVisibility);

  const handleCreateList = async (listData: any) => {
    try {
      await createList(listData);
      setIsCreateModalOpen(false);
      // Refresh the lists
      fetchLists(1, false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleUpdateList = async (listId: string, params: any) => {
    try {
      // This would need to be implemented in the useUserLists hook
      console.log('Update list:', listId, params);
      // Refresh the lists
      fetchLists(1, false);
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      // This would need to be implemented in the useUserLists hook
      console.log('Delete list:', listId);
      // Refresh the lists
      fetchLists(1, false);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleVisibilityChange = (visibility: ListVisibility | undefined) => {
    setCurrentVisibility(visibility);
    // Reset to first page when changing filters
    fetchLists(1, false);
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
    // Reset to first page when changing sort
    fetchLists(1, false);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <div className="text-sm font-medium">{error.message || 'Failed to load lists'}</div>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Since this component is only shown on own profile, show all lists
  // The backend should handle permissions and return only appropriate lists
  const filteredLists = lists;

  return (
    <div className="space-y-6">
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">My Lists</h2>
          <p className="text-gray-600">Manage your saved lists and collections</p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create List
        </Button>
      </div>

      {/* Filters */}
      <UserListFilters
        currentVisibility={currentVisibility}
        onVisibilityChange={handleVisibilityChange}
        currentSort={currentSort}
        onSortChange={handleSortChange}
      />

      {/* Lists Grid */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
          <p className="text-gray-600 mb-4">Start creating lists to organize your research</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLists.map((list) => (
              <UserListCard
                key={list.id}
                list={list}
                onUpdate={handleUpdateList}
                onDelete={handleDeleteList}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outlined" onClick={loadMore} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </div>
  );
};

export default UserLists;
