'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/form/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/form/Input';
import { Search, Plus, Check, FileText, User, Hash } from 'lucide-react';
import { UserListService } from '@/services/userList.service';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import type { AddDocumentToListParams } from '@/types/userList';
import type { SearchSuggestion, EntityType } from '@/types/search';
import { ID } from '@/types/root';

interface AddItemsToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listTitle: string;
  onItemAdded?: () => void;
}

export const AddItemsToListModal = ({
  isOpen,
  onClose,
  listId,
  listTitle,
  onItemAdded,
}: AddItemsToListModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use real search functionality
  const { suggestions, loading } = useSearchSuggestions({
    query: searchQuery,
    indices: useMemo(() => ['paper', 'post', 'hub'], []), // Search for papers, posts, and hubs (notes)
    debounceMs: 300,
    minQueryLength: 2,
  });

  const handleAddDocument = async (documentId: ID, documentType: 'paper' | 'post' | 'note') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const params: AddDocumentToListParams = {
        listId,
        documentId,
        documentType,
        comment: comment.trim() || undefined,
      };

      await UserListService.addDocumentToList(params);
      setSuccess(`Document added to "${listTitle}"`);

      // Call the callback to refresh the list
      if (onItemAdded) {
        onItemAdded();
      }

      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add document to list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSearchQuery('');
      setComment('');
      setError(null);
      setSuccess(null);
    }
  };

  // Filter suggestions to only show documents (papers, posts, notes)
  const documentSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.entityType === 'paper' ||
      suggestion.entityType === 'post' ||
      suggestion.entityType === 'hub'
  );

  // Helper function to get document type for list
  const getDocumentType = (suggestion: SearchSuggestion): 'paper' | 'post' | 'note' => {
    switch (suggestion.entityType) {
      case 'paper':
        return 'paper';
      case 'post':
        return 'post';
      case 'hub':
        return 'note'; // Treat hubs as notes for list purposes
      default:
        return 'paper';
    }
  };

  // Helper function to get document icon
  const getDocumentIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.entityType) {
      case 'paper':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'post':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'hub':
        return <Hash className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper function to get document description
  const getDocumentDescription = (suggestion: SearchSuggestion) => {
    if (suggestion.entityType === 'paper') {
      const authors = suggestion.authors?.slice(0, 3).join(', ');
      return authors ? `by ${authors}${suggestion.authors.length > 3 ? '...' : ''}` : '';
    } else if (suggestion.entityType === 'hub') {
      return suggestion.description || '';
    }
    return '';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Items to "${listTitle}"`}>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 mt-1">Search for documents to add to your list</p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search papers, posts, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Comment Input */}
        <div>
          <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-1">
            Add a comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your thoughts about this document..."
            disabled={isSubmitting}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm resize-none"
          />
        </div>

        {error && (
          <Alert variant="error">
            <div className="text-sm font-medium">{error}</div>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <Check className="h-4 w-4" />
            <div className="text-sm font-medium">{success}</div>
          </Alert>
        )}

        {/* Document Results */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading && searchQuery.length >= 2 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : documentSuggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery.length >= 2
                ? 'No documents found'
                : 'Start typing to search for documents'}
            </div>
          ) : (
            documentSuggestions.map((suggestion, index) => {
              const documentType = getDocumentType(suggestion);
              const description = getDocumentDescription(suggestion);

              return (
                <div
                  key={`${suggestion.entityType}-${suggestion.id || (suggestion.entityType === 'paper' ? (suggestion as any).doi : null) || suggestion.displayName || index}`}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getDocumentIcon(suggestion)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {suggestion.displayName}
                      </div>
                      {description && (
                        <div className="text-sm text-gray-600 truncate">{description}</div>
                      )}
                      <div className="text-xs text-gray-500 capitalize">
                        {suggestion.entityType}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => handleAddDocument(suggestion.id, documentType)}
                    disabled={isSubmitting}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
