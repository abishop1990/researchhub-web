'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/form/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/form/Input';
import { AlertCircle, Search, Plus, Check } from 'lucide-react';
import { UserListService } from '@/services/userList.service';
import type { AddDocumentToListParams } from '@/types/userList';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddDocument = async (documentId: ID, documentType: 'paper' | 'post' | 'note') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const params: AddDocumentToListParams = {
        listId,
        documentId,
        documentType,
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
      setError(null);
      setSuccess(null);
    }
  };

  // Mock data for demonstration - in a real app, this would come from a search API
  const mockDocuments = [
    {
      id: '1',
      title: 'Sample Research Paper',
      type: 'paper' as const,
      description: 'A sample research paper for testing',
    },
    {
      id: '2',
      title: 'Interesting Post',
      type: 'post' as const,
      description: 'A sample post for testing',
    },
    {
      id: '3',
      title: 'My Notes',
      type: 'note' as const,
      description: 'Personal notes for testing',
    },
  ];

  const filteredDocuments = mockDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {error && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
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
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No documents found' : 'Start typing to search for documents'}
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{document.title}</h4>
                  <p className="text-sm text-gray-600">{document.description}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {document.type}
                  </span>
                </div>
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => handleAddDocument(document.id, document.type)}
                  disabled={isSubmitting}
                  className="ml-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
