export type SchemaRole = {
  _id: string;
  guild_id: string | null;
  role_id: string;
  elevated: boolean;
  weight: number;
};

export type SchemaUser = {
  _id: string;
  guild_id: string | null;
  name: string;
  avatar: string;
  created_at: Date;
  role: string;
};

export type SchemaWelcomeMessage = {
  _id: string;
  channel_ids: string[];
  role_ids: string[];
  ping_user: boolean;
  message: string;
  hex_color: number;
};

export type SchemaLeaveMessage = {
  _id: string;
  channel_ids: string[];
  message: string;
  hex_color: number;
};

export type SchemaArchive = {
  _id: string;
  user_channel: string;
  staff_channel: string;
};
