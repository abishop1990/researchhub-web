'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserList } from '@/hooks/useUserLists';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/form/Modal';
import { ShareListModal } from './ShareListModal';
import { AddItemsToListModal } from './AddItemsToListModal';
import {
  ArrowLeft,
  Edit,
  Share,
  Eye,
  EyeOff,
  Users,
  Lock,
  Calendar,
  FileText,
  AlertCircle,
  Plus,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/styles';
import type { ListVisibility } from '@/types/userList';

interface UserListDetailProps {
  listId: string;
}

export const UserListDetail = ({ listId }: UserListDetailProps) => {
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    list,
    isLoading,
    error,
    updateList,
    removeDocumentFromList,
    reorderDocuments,
    fetchList,
    deleteList,
  } = useUserList(listId);

  // Helper function to generate document links
  const getDocumentLink = (
    documentId: string | number | null | undefined,
    documentType: string
  ) => {
    if (!documentId) return '#';

    const idString = String(documentId);

    switch (documentType) {
      case 'paper':
        return `/paper/${idString}`;
      case 'post':
        return `/post/${idString}`;
      case 'note':
        return `/notebook/${idString}`;
      default:
        return '#';
    }
  };

  // Helper function to get document type icon
  const getDocumentTypeIcon = (documentType: string) => {
    switch (documentType) {
      case 'paper':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'post':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'note':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVisibilityIcon = () => {
    switch (list?.visibility) {
      case 'PUBLIC':
        return <Eye className="h-4 w-4" />;
      case 'SHARED':
        return <Users className="h-4 w-4" />;
      case 'PRIVATE':
        return <Lock className="h-4 w-4" />;
      default:
        return <EyeOff className="h-4 w-4" />;
    }
  };

  const getVisibilityLabel = () => {
    switch (list?.visibility) {
      case 'PUBLIC':
        return 'Public';
      case 'SHARED':
        return 'Shared';
      case 'PRIVATE':
        return 'Private';
      default:
        return 'Unknown';
    }
  };

  const getVisibilityColor = () => {
    switch (list?.visibility) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800';
      case 'SHARED':
        return 'bg-blue-100 text-blue-800';
      case 'PRIVATE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <div className="text-sm font-medium">{error.message || 'Failed to load list'}</div>
        </Alert>
      </div>
    );
  }

  if (isLoading || !list) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{list.title}</h1>
            {list.description && <p className="text-gray-600 mb-4">{list.description}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>
                  {list.itemCount || 0} {list.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {list.updatedAt && !isNaN(new Date(list.updatedAt).getTime())
                    ? `Updated ${new Date(list.updatedAt).toLocaleDateString()}`
                    : list.createdAt && !isNaN(new Date(list.createdAt).getTime())
                      ? `Created ${new Date(list.createdAt).toLocaleDateString()}`
                      : ''}
                </span>
              </div>
              <Badge className={cn('text-xs', getVisibilityColor())}>
                <div className="flex items-center gap-1">
                  {getVisibilityIcon()}
                  {getVisibilityLabel()}
                </div>
              </Badge>
              {list.currentUserPermission && (
                <Badge className="text-xs bg-blue-100 text-blue-800">
                  {list.currentUserPermission}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {list.canEdit && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setIsAddItemsModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Items
                </Button>
                <Link href={`/lists/${list.id}/edit`}>
                  <Button variant="outlined">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button variant="outlined" onClick={() => setIsShareModalOpen(true)}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            {list.canDelete && (
              <Button
                variant="outlined"
                className="text-red-600 border-red-300 hover:text-red-700 hover:bg-red-50 hover:border-red-400"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {list.tags && list.tags.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {list.tags.map((tag, index) => (
              <Badge key={index} variant="primary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          {list.canAddDocuments && (
            <Button
              variant="outlined"
              onClick={() => setIsAddItemsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Items
            </Button>
          )}
        </div>

        {list.documents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
            <p className="text-gray-600 mb-4">Start adding documents to your list</p>
            <Button
              variant="outlined"
              onClick={() => setIsAddItemsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Items
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {list.documents.map((document, index) => {
              const documentLink = getDocumentLink(document.documentId, document.documentType);
              const documentTitle = document.content?.title || `Document ${document.documentId}`;
              const documentDescription =
                (document.content as any)?.description ||
                (document.addedAt && !isNaN(new Date(document.addedAt).getTime())
                  ? `Added ${new Date(document.addedAt).toLocaleDateString()}`
                  : '');

              return (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-8">{index + 1}</span>
                      <div className="flex items-center gap-2">
                        {getDocumentTypeIcon(document.documentType)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={documentLink}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {documentTitle}
                            </Link>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                          {documentDescription && (
                            <p className="text-sm text-gray-600 mt-1">{documentDescription}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="text-xs">
                      {document.documentType}
                    </Badge>
                    {list.canEdit && (
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() =>
                          removeDocumentFromList(String(document.documentId), document.documentType)
                        }
                        className="text-red-600 border-red-300 hover:text-red-700 hover:bg-red-50 hover:border-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {list && (
        <ShareListModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          list={list}
        />
      )}

      {/* Add Items Modal */}
      {list && (
        <AddItemsToListModal
          isOpen={isAddItemsModalOpen}
          onClose={() => setIsAddItemsModalOpen(false)}
          listId={list.id?.toString() || ''}
          listTitle={list.title}
          onItemAdded={fetchList}
        />
      )}

      {/* Delete Confirmation Modal */}
      {list && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
          title="Delete List"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete "{list.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outlined"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteList();
                    // Navigate back to lists page after successful deletion
                    router.push('/lists');
                  } catch (error) {
                    console.error('Failed to delete list:', error);
                    alert('Failed to delete list. Please try again.');
                  } finally {
                    setIsDeleting(false);
                    setIsDeleteModalOpen(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
