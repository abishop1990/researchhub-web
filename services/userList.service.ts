import { ApiClient } from './client';
import {
  transformUserList,
  transformListDocument,
  transformUserListWithDocuments,
} from '@/types/userList';
import type {
  UserList,
  UserListWithDocuments,
  ListDocument,
  CreateUserListParams,
  UpdateUserListParams,
  AddDocumentToListParams,
  RemoveDocumentFromListParams,
  AddPermissionParams,
  RemovePermissionParams,
  UserListListResponse,
  ListVisibility,
} from '@/types/userList';
import { ID } from '@/types/root';
import { ApiError } from './types';

export class UserListError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'UserListError';
  }
}

export class UserListService {
  private static readonly BASE_PATH = '/api/lists';

  /**
   * Fetches all accessible lists (owned + shared + public)
   * @param params - Optional query parameters
   * @throws {UserListError} When the request fails
   */
  static async getUserLists(params?: {
    page?: number;
    pageLimit?: number;
  }): Promise<UserListListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageLimit) queryParams.append('page_limit', params.pageLimit.toString());

      const url = `${this.BASE_PATH}/?${queryParams.toString()}`;
      const response = await ApiClient.get<any>(url);

      return {
        count: response.count || 0,
        next: response.next || null,
        previous: response.previous || null,
        results: response.results.map(transformUserList),
      };
    } catch (error) {
      let errorMsg = 'Failed to fetch user lists';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Fetches a specific list by ID
   * @param listId - The ID of the list to fetch
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async getUserList(listId: string): Promise<UserListWithDocuments> {
    if (!listId) {
      throw new UserListError('Missing list ID', 'INVALID_PARAMS');
    }

    try {
      const response = await ApiClient.get<any>(`${this.BASE_PATH}/${listId}/`);
      return transformUserListWithDocuments(response);
    } catch (error) {
      let errorMsg = 'Failed to fetch user list';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Creates a new user list
   * @param params - List creation parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async createUserList(params: CreateUserListParams): Promise<UserList> {
    if (!params.title) {
      throw new UserListError('Title is required', 'INVALID_PARAMS');
    }

    try {
      // Transform frontend params to match backend API spec
      const backendParams = {
        list_name: params.title,
        description: params.description || '',
        is_public: params.visibility === 'PUBLIC',
        tags: params.tags || [],
      };

      const response = await ApiClient.post<any>(`${this.BASE_PATH}/`, backendParams);
      return transformUserList(response);
    } catch (error) {
      let errorMsg = 'Failed to create user list';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Updates an existing user list
   * @param listId - The ID of the list to update
   * @param params - Update parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async updateUserList(listId: string, params: UpdateUserListParams): Promise<UserList> {
    if (!listId) {
      throw new UserListError('Missing list ID', 'INVALID_PARAMS');
    }

    try {
      // Transform frontend params to match backend API spec
      const backendParams: any = {};
      if (params.title) backendParams.list_name = params.title;
      if (params.description !== undefined) backendParams.description = params.description;
      if (params.visibility !== undefined) backendParams.is_public = params.visibility === 'PUBLIC';
      if (params.tags !== undefined) backendParams.tags = params.tags;

      const response = await ApiClient.patch<any>(`${this.BASE_PATH}/${listId}/`, backendParams);
      return transformUserList(response);
    } catch (error) {
      let errorMsg = 'Failed to update user list';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Deletes a user list
   * @param listId - The ID of the list to delete
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async deleteUserList(listId: string): Promise<void> {
    if (!listId) {
      throw new UserListError('Missing list ID', 'INVALID_PARAMS');
    }

    try {
      await ApiClient.delete(`${this.BASE_PATH}/${listId}/`);
    } catch (error) {
      let errorMsg = 'Failed to delete user list';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Adds a document to a list
   * @param params - Add document parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async addDocumentToList(params: AddDocumentToListParams): Promise<ListDocument> {
    if (!params.listId || !params.documentId || !params.documentType) {
      throw new UserListError('Missing required parameters', 'INVALID_PARAMS');
    }

    try {
      // Transform to match backend API spec
      const backendParams: any = {};
      if (params.documentType === 'paper') {
        backendParams.paper_id = params.documentId;
      } else {
        backendParams.u_doc_id = params.documentId;
      }

      const response = await ApiClient.post<any>(
        `${this.BASE_PATH}/${params.listId}/add_document/`,
        backendParams
      );
      return transformListDocument(response);
    } catch (error) {
      let errorMsg = 'Failed to add document to list';
      if (error instanceof ApiError) {
        // Try to extract the most meaningful error message
        // The error.errors might be the raw response data from the backend
        if (error.errors && typeof error.errors === 'object') {
          // Check if it's the raw response structure
          if (error.errors.detail && Array.isArray(error.errors.detail)) {
            const detail = error.errors.detail[0];
            errorMsg = (typeof detail === 'string' ? detail : String(detail)) || errorMsg;
          } else if (error.errors.message) {
            errorMsg = Array.isArray(error.errors.message)
              ? String(error.errors.message[0])
              : String(error.errors.message);
          } else if (error.errors.error) {
            // Handle the specific error format we're seeing
            errorMsg = Array.isArray(error.errors.error)
              ? String(error.errors.error[0])
              : String(error.errors.error);
          } else if (typeof error.errors === 'string') {
            errorMsg = error.errors;
          }
        } else if (error.message && error.message !== 'Request failed') {
          errorMsg = error.message;
        }

        // Add status code to error message for debugging
        if (error.status) {
          errorMsg = `[${error.status}] ${errorMsg}`;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Removes a document from a list
   * @param params - Remove document parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async removeDocumentFromList(params: RemoveDocumentFromListParams): Promise<void> {
    if (!params.listId || !params.documentId) {
      throw new UserListError('Missing required parameters', 'INVALID_PARAMS');
    }

    try {
      // Transform to match backend API spec
      const backendParams: any = {};
      if (params.documentType === 'paper') {
        backendParams.paper_id = params.documentId;
      } else {
        backendParams.u_doc_id = params.documentId;
      }

      await ApiClient.post(`${this.BASE_PATH}/${params.listId}/remove_document/`, backendParams);
    } catch (error) {
      let errorMsg = 'Failed to remove document from list';
      if (error instanceof ApiError) {
        // Try to extract the most meaningful error message
        // The error.errors might be the raw response data from the backend
        if (error.errors && typeof error.errors === 'object') {
          // Check if it's the raw response structure
          if (error.errors.detail && Array.isArray(error.errors.detail)) {
            const detail = error.errors.detail[0];
            errorMsg = (typeof detail === 'string' ? detail : String(detail)) || errorMsg;
          } else if (error.errors.message) {
            errorMsg = Array.isArray(error.errors.message)
              ? String(error.errors.message[0])
              : String(error.errors.message);
          } else if (error.errors.error) {
            // Handle the specific error format we're seeing
            errorMsg = Array.isArray(error.errors.error)
              ? String(error.errors.error[0])
              : String(error.errors.error);
          } else if (typeof error.errors === 'string') {
            errorMsg = error.errors;
          }
        } else if (error.message && error.message !== 'Request failed') {
          errorMsg = error.message;
        }

        // Add status code to error message for debugging
        if (error.status) {
          errorMsg = `[${error.status}] ${errorMsg}`;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Adds permission for a user to access a list
   * @param params - Add permission parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async addPermission(params: AddPermissionParams): Promise<void> {
    if (!params.listId || !params.userId || !params.permissionLevel) {
      throw new UserListError('Missing required parameters', 'INVALID_PARAMS');
    }

    try {
      await ApiClient.post(`${this.BASE_PATH}/${params.listId}/add_permission/`, {
        user_id: params.userId,
        permission: params.permissionLevel,
      });
    } catch (error) {
      let errorMsg = 'Failed to add permission';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Removes permission for a user to access a list
   * @param params - Remove permission parameters
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async removePermission(params: RemovePermissionParams): Promise<void> {
    if (!params.listId || !params.userId) {
      throw new UserListError('Missing required parameters', 'INVALID_PARAMS');
    }

    try {
      await ApiClient.post(`${this.BASE_PATH}/${params.listId}/remove_permission/`, {
        user_id: params.userId,
      });
    } catch (error) {
      let errorMsg = 'Failed to remove permission';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Reorders documents in a list
   * @param listId - The ID of the list
   * @param documentIds - Array of document IDs in the desired order
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async reorderListDocuments(listId: string, documentIds: ID[]): Promise<void> {
    if (!listId || !documentIds.length) {
      throw new UserListError('Missing required parameters', 'INVALID_PARAMS');
    }

    try {
      await ApiClient.patch(`${this.BASE_PATH}/${listId}/reorder/`, {
        document_ids: documentIds,
      });
    } catch (error) {
      let errorMsg = 'Failed to reorder list documents';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }

  /**
   * Fetches a shared list by share token (public access)
   * @param shareToken - The share token for the list
   * @throws {UserListError} When the request fails or parameters are invalid
   */
  static async getSharedList(shareToken: string): Promise<UserListWithDocuments> {
    if (!shareToken) {
      throw new UserListError('Missing share token', 'INVALID_PARAMS');
    }

    try {
      const response = await ApiClient.get<any>(`/api/shared/list/${shareToken}/`);
      return transformUserListWithDocuments(response);
    } catch (error) {
      let errorMsg = 'Failed to fetch shared list';
      if (error instanceof ApiError) {
        errorMsg = error.errors?.detail?.[0] || error.message || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      throw new UserListError(errorMsg);
    }
  }
}
