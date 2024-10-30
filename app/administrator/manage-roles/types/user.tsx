export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
  }
  
  export type Role = 'member' | 'volunteer' | 'moderator' | 'administrator';