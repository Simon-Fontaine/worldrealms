export type PollChoice = {
  choice: string;
  emoji: string;
  voters: string[];
};

export type Poll = {
  _id: string;
  guild_id: string;
  channel_id: string;
  result_message_id: string | null | undefined;
  creator_id: string;
  creator_username: string;
  question: string;
  choices: PollChoice[];
  allowed_roles: string[];
  max_choices: number | null | undefined;
  created_at: Date;
  closed_at: Date | null | undefined;
  expires_at: Date | null | undefined;
};

export type TimeObject = {
  date: Date;
  small: string;
  normal: string;
  full: string;
};

export type SchemaTicket = {
  _id: string;
  guild_id: string;
  type: string;
  label: string;
  creator_id: string;
  creator_username: string;
  claimed_id: string | null | undefined;
  claimed_username: string | null | undefined;
  closed_id: string | null | undefined;
  closed_username: string | null | undefined;
  added_members: string[];
  locked: boolean;
  claimed: boolean;
  closed: boolean;
  updatedAt: Date;
  createdAt: Date;
};

export type SchemaRole = {
  _id: string;
  guild_id: string | null;
  role_id: string;
  elevated: boolean;
  weight: number;
};

export type SchemaUser = {
  _id: string;
  user_id: string;
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
  attachment: string | null;
  hex_color: number;
};

export type SchemaLeaveMessage = {
  _id: string;
  channel_ids: string[];
  message: string;
  attachment: string | null;
  hex_color: number;
};

export type SchemaArchive = {
  _id: string;
  user_channel: string;
  staff_channel: string;
};
