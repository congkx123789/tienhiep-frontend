import api from '../core/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { Book, BooksSearchResponse } from '../../types';

export const bookService = {
  getBooks: async (params: { q?: string; page?: number; limit?: number; sort?: string; category?: string } = {}): Promise<BooksSearchResponse> => {
    const res = await api.get(API_ENDPOINTS.BOOKS.LIST, { params });
    return res.data;
  },

  getRecentBooks: async (limit: number = 20): Promise<BooksSearchResponse> => {
    const res = await api.get(API_ENDPOINTS.BOOKS.RECENT, { params: { limit } });
    return res.data;
  },

  getBookDetail: async (bookId: number | string): Promise<Book> => {
    const res = await api.get(API_ENDPOINTS.BOOKS.DETAIL(bookId));
    return res.data;
  },

  getBooksByAuthor: async (authorName: string): Promise<BooksSearchResponse> => {
    const res = await api.get(API_ENDPOINTS.BOOKS.BY_AUTHOR(authorName));
    return res.data;
  },

  shareBook: async (data: { book_id: number | string; friend_id?: number | string; message?: string }) => {
    const res = await api.post(API_ENDPOINTS.BOOKS.SHARE, data);
    return res.data;
  },

  getChapterContent: async (bookId: number | string, chapterIdx: number | string = 0) => {
    const res = await api.get(API_ENDPOINTS.CHAPTERS.CONTENT(bookId, chapterIdx));
    return res.data;
  },

  getBookTranslations: async (bookId: number | string) => {
    try {
      const res = await api.get(API_ENDPOINTS.BOOKS.TRANSLATIONS(bookId));
      return res.data;
    } catch {
      return { data: null };
    }
  },
};

export default bookService;
