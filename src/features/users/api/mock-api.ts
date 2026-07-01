export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@velacorp.com', role: 'admin', tenantId: 'tenant-alpha' },
  { id: '2', name: 'Bruno Costa', email: 'bruno.costa@velacorp.com', role: 'editor', tenantId: 'tenant-alpha' },
  { id: '3', name: 'Carla Mendes', email: 'carla.mendes@velacorp.com', role: 'viewer', tenantId: 'tenant-beta' },
  { id: '4', name: 'Diego Alves', email: 'diego.alves@velacorp.com', role: 'editor', tenantId: 'tenant-beta' },
  { id: '5', name: 'Elisa Nogueira', email: 'elisa.nogueira@velacorp.com', role: 'admin', tenantId: 'tenant-gamma' },
  { id: '6', name: 'Felipe Rocha', email: 'felipe.rocha@velacorp.com', role: 'viewer', tenantId: 'tenant-gamma' },
];

const FETCH_DELAY_MS = 1000;
const CREATE_DELAY_MS = 1500;
const CURRENT_TENANT_ID = 'tenant-alpha';

export async function fetchUsers(search?: string): Promise<User[]> {
  await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));

  if (!search) {
    return MOCK_USERS;
  }

  const normalizedSearch = search.trim().toLowerCase();
  return MOCK_USERS.filter((user) => user.name.toLowerCase().includes(normalizedSearch));
}

export type CreateUserInput = Pick<User, 'name' | 'email' | 'role'>;

export async function createUser(input: CreateUserInput): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, CREATE_DELAY_MS));

  const newUser: User = {
    id: crypto.randomUUID(),
    tenantId: CURRENT_TENANT_ID,
    ...input,
  };

  MOCK_USERS.push(newUser);
  return newUser;
}
