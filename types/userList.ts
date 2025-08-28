import { ID } from './root';
import { createTransformer, BaseTransformed } from './transformer';
import { transformPaper } from './paper';
import { transformNote } from './note';
import type { Paper } from './paper';
import type { Work } from './work';
import type { Note } from './note';

export type ListVisibility = 'PRIVATE' | 'PUBLIC' | 'SHARED';

export type PermissionLevel = 'VIEW' | 'EDIT' | 'ADMIN';

export interface ListPermission {
  id: ID;
  userId: ID;
  userName: string;
  permissionLevel: PermissionLevel;
  grantedAt: string;
  grantedBy: ID;
}

export interface ListDocument {
  id: ID;
  documentId: ID;
  documentType: 'paper' | 'post' | 'note';
  addedAt: string;
  addedBy: ID;
  order: number;
  comment?: string; // User's comment on this list item
  // Document content for display
  content?: Paper | Work | Note;
  // Handle deleted documents
  isDeleted?: boolean;
  deletionDate?: string;
  // Raw data from API for debugging/fallback
  raw?: any;
}

export interface UserList {
  id: ID;
  title: string;
  description?: string;
  visibility: ListVisibility;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  // New permission fields
  canEdit: boolean;
  canDelete: boolean;
  canAddDocuments: boolean;
  currentUserPermission: 'OWNER' | 'ADMIN' | 'EDIT' | 'VIEW' | null;
  isOwner: boolean;
  // Legacy fields (keep for backward compatibility)
  isEditable: boolean;
  isShared: boolean;
  sharedWith?: ID[];
  tags?: string[];
}

export interface UserListWithDocuments extends UserList {
  documents: ListDocument[];
  permissions: ListPermission[];
}

// API Response interfaces
export interface UserListApiResponse {
  id: ID;
  list_name: string; // Backend uses list_name instead of title
  description: string | null;
  is_public: boolean; // Backend uses is_public instead of visibility
  created_by_username?: string; // Backend might return this
  created_date?: string; // Backend might return this instead of created_at
  updated_at?: string; // Backend might return this
  item_count?: number; // Backend might return document_count instead
  document_count?: number; // Backend actually returns this
  // New permission fields
  can_edit?: boolean;
  can_delete?: boolean;
  can_add_documents?: boolean;
  current_user_permission?: 'OWNER' | 'ADMIN' | 'EDIT' | 'VIEW' | null;
  is_owner?: boolean;
  // Legacy fields (keep for backward compatibility)
  is_editable?: boolean;
  is_shared?: boolean;
  shared_with?: ID[] | null;
  tags?: string[] | null;
  share_url?: string | null; // Backend returns this
}

export interface ListDocumentApiResponse {
  id: ID;
  document_id?: ID;
  document_type?: 'paper' | 'post' | 'note';
  added_at?: string;
  added_by?: ID;
  order?: number;
  comment?: string; // Backend comment field
  content?: any; // Raw content from API
  is_deleted?: boolean;
  deletion_date?: string;
  // Backend might return paper_id or u_doc_id instead of document_id
  paper_id?: ID;
  u_doc_id?: ID;
  // Actual backend structure we're seeing
  unified_document?: ID;
  document_info?: {
    document_type?: 'paper' | 'post' | 'note';
    [key: string]: any;
  };
}

export interface ListPermissionApiResponse {
  id: ID;
  user_id: ID;
  user_name: string;
  permission_level: PermissionLevel;
  granted_at: string;
  granted_by: ID;
}

export interface UserListListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserList[];
}

// Create/Update interfaces
export interface CreateUserListParams {
  title: string;
  description?: string;
  visibility: ListVisibility;
  tags?: string[];
}

export interface UpdateUserListParams {
  title?: string;
  description?: string;
  visibility?: ListVisibility;
  tags?: string[];
}

export interface AddDocumentToListParams {
  listId: ID;
  documentId: ID;
  documentType: 'paper' | 'post' | 'note';
  comment?: string; // Optional comment when adding document to list
}

export interface RemoveDocumentFromListParams {
  listId: ID;
  documentId: ID;
  documentType: 'paper' | 'post' | 'note';
}

export interface AddPermissionParams {
  listId: ID;
  userId: ID;
  permissionLevel: PermissionLevel;
}

export interface RemovePermissionParams {
  listId: ID;
  userId: ID;
}

export interface ShareListParams {
  listId: ID;
  userIds: ID[];
  message?: string;
}

// Transformed types
export type TransformedUserList = UserList & BaseTransformed;
export type TransformedListDocument = ListDocument & BaseTransformed;
export type TransformedListPermission = ListPermission & BaseTransformed;

// Transformers
export const transformUserList = createTransformer<UserListApiResponse, UserList>((raw) => {
  const transformed: UserList = {
    id: raw.id,
    title: raw.list_name, // Transform list_name to title
    description: raw.description || undefined,
    visibility: raw.is_public ? 'PUBLIC' : 'PRIVATE', // Transform is_public to visibility
    createdBy: raw.created_by_username || 'Unknown', // Use username as fallback
    createdAt: raw.created_date || raw.updated_at || new Date().toISOString(), // Use created_date or fallback
    updatedAt: raw.updated_at || raw.created_date || new Date().toISOString(), // Use updated_at or fallback
    itemCount: raw.document_count || raw.item_count || 0, // Use document_count or fallback
    // New permission fields
    canEdit: raw.can_edit ?? raw.is_editable ?? true, // Use new field, fallback to legacy, then default to true
    canDelete: raw.can_delete ?? false,
    canAddDocuments: raw.can_add_documents ?? raw.is_editable ?? true, // Use new field, fallback to legacy, then default to true
    currentUserPermission: raw.current_user_permission ?? null,
    isOwner: raw.is_owner ?? false,
    // Legacy fields (keep for backward compatibility)
    isEditable: raw.can_edit ?? raw.is_editable ?? true, // Map to new field for backward compatibility
    isShared: raw.is_shared || false, // Provide fallback
    sharedWith: raw.shared_with || undefined,
    tags: raw.tags || undefined,
  };

  return transformed;
});

export const transformListDocument = createTransformer<ListDocumentApiResponse, ListDocument>(
  (raw) => {
    // Handle the actual backend structure we're seeing
    const documentId = raw.unified_document || raw.document_id || raw.paper_id || raw.u_doc_id;
    const documentInfo = raw.document_info || {};
    const documentType = documentInfo.document_type || raw.document_type || 'paper'; // Default to 'paper'

    return {
      id: raw.id,
      documentId: documentId,
      documentType: documentType,
      addedAt: raw.added_at || new Date().toISOString(), // Default to current time
      addedBy: raw.added_by || 0, // Default to 0 if not provided
      order: raw.order || 0, // Default to 0 if not provided
      comment: raw.comment || undefined, // Transform comment field
      content: raw.content ? transformContent(raw.content, documentType) : undefined,
      isDeleted: raw.is_deleted || false,
      deletionDate: raw.deletion_date || undefined,
      // Keep the raw data for debugging
      raw: raw,
    };
  }
);

export const transformListPermission = createTransformer<ListPermissionApiResponse, ListPermission>(
  (raw) => ({
    id: raw.id,
    userId: raw.user_id,
    userName: raw.user_name,
    permissionLevel: raw.permission_level,
    grantedAt: raw.granted_at,
    grantedBy: raw.granted_by,
  })
);

// Helper function to transform content based on type
const transformContent = (content: any, documentType: 'paper' | 'post' | 'note') => {
  switch (documentType) {
    case 'paper':
      return transformPaper(content);
    case 'post':
      return content; // Work type doesn't need transformation
    case 'note':
      return transformNote(content);
    default:
      return content;
  }
};

export const transformUserListWithDocuments = createTransformer<any, UserListWithDocuments>(
  (raw) => ({
    ...transformUserList(raw),
    documents: Array.isArray(raw.documents) ? raw.documents.map(transformListDocument) : [],
    permissions: Array.isArray(raw.permissions) ? raw.permissions.map(transformListPermission) : [],
  })
);
