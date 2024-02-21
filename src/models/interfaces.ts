export interface SchemaRole {
  _id: string;
  guild_id: string | null;
  role_id: string;
  elevated: boolean;
  weight: number;
}

export interface SchemaUser {
  _id: string;
  guild_id: string | null;
  name: string;
  avatar: string;
  created_at: Date;
  role: string;
}
