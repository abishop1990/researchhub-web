'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/form/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/form/Input';
import { Textarea } from '@/components/ui/form/Textarea';
import { Plus, X } from 'lucide-react';
import type { ListVisibility } from '@/types/userList';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    title: string;
    description?: string;
    visibility: ListVisibility;
    tags?: string[];
  }) => Promise<void>;
}

export const CreateListModal = ({ isOpen, onClose, onSubmit }: CreateListModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<ListVisibility>('PRIVATE');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setVisibility('PRIVATE');
      setTags([]);
      setNewTag('');
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New List">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
            Title *
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter list title"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of your list"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="visibility" className="block text-sm font-semibold text-gray-700 mb-1">
            Visibility
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ListVisibility)}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
          >
            <option value="PRIVATE">Private - Only you can see this list</option>
            <option value="SHARED">Shared - Only people you invite can see this list</option>
            <option value="PUBLIC">Public - Anyone can see this list</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Tags</label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag"
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim() || isSubmitting}
                variant="outlined"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-primary-600 hover:text-primary-800"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create List'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
