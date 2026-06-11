import { vi } from 'vitest';

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
};

export function createMockQuery(resolved: { data: unknown; error: unknown | null; count?: number }): MockQuery {
  const chain: Partial<MockQuery> = {};

  const self: MockQuery = {
    select: vi.fn().mockImplementation(() => self),
    insert: vi.fn().mockImplementation(() => self),
    update: vi.fn().mockImplementation(() => self),
    delete: vi.fn().mockImplementation(() => Promise.resolve(resolved)),
    eq: vi.fn().mockImplementation(() => self),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolved)),
    order: vi.fn().mockImplementation(() => self),
    range: vi.fn().mockImplementation(() => Promise.resolve(resolved)),
  };

  return self;
}

export function createMockSupabase() {
  const queryResult = { data: null, error: null, count: 0 };
  const mockQuery = createMockQuery(queryResult);

  const from = vi.fn().mockReturnValue(mockQuery);

  return {
    from,
    queryResult,
    mockQuery,
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url/file' } }),
        list: vi.fn(),
      }),
    },
  };
}
