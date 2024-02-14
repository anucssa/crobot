type Nullable<T> = T | null;

export const BASEROW_ITEM_FIELDS = {
  ID: "field_4740",
  FIRST_NAME: "field_4741",
  LAST_NAME: "field_4742",
  UID: "field_4743",
  EMAIL: "field_4744",
  FLAGS: "field_4746",
  MEMBERSHIP_CARD_NUMBER: "field_4748",
  CREATED_AT: "field_4749",
  DISCORD_USERNAME: "field_4760",
} as const;

export type BASEROW_ITEM_FIELDS =
  (typeof BASEROW_ITEM_FIELDS)[keyof typeof BASEROW_ITEM_FIELDS];

interface BaserowBaseWebhook {
  table_id: 511;
  database_id: 97;
  workspace_id: 96;
  event_id: string;
}

interface BaserowCreatedWebhook extends BaserowBaseWebhook {
  event_type: "rows.created";
  items: BaserowItem[];
}

interface BaserowUpdatedWebhook extends BaserowBaseWebhook {
  event_type: "rows.updated";
  items: BaserowItem[];
  old_items: BaserowItem[];
}

interface BaserowDeletedWebhook extends BaserowBaseWebhook {
  event_type: "rows.deleted";
  row_ids: number[];
}

export type BaserowWebhook =
  | BaserowCreatedWebhook
  | BaserowUpdatedWebhook
  | BaserowDeletedWebhook;

export interface BaserowItem {
  id: number;
  order: string;
  // Member ID
  [BASEROW_ITEM_FIELDS.ID]: string;
  // First Name
  [BASEROW_ITEM_FIELDS.FIRST_NAME]: Nullable<string>;
  // Last Name
  [BASEROW_ITEM_FIELDS.LAST_NAME]: Nullable<string>;
  // UID
  [BASEROW_ITEM_FIELDS.UID]: Nullable<string>;
  // Email
  [BASEROW_ITEM_FIELDS.EMAIL]: Nullable<string>;
  // Flags
  [BASEROW_ITEM_FIELDS.FLAGS]: BaserowFlags[];
  // Membership Card Number
  [BASEROW_ITEM_FIELDS.MEMBERSHIP_CARD_NUMBER]: Nullable<string>;
  // Created At
  [BASEROW_ITEM_FIELDS.CREATED_AT]: Date;
  // Discord Username
  [BASEROW_ITEM_FIELDS.DISCORD_USERNAME]: Nullable<string>;
}

type BaserowFlags =
  | {
      id: 2522;
      color: "cyan";
      value: "Committee";
    }
  | {
      id: 2521;
      color: "green";
      value: "Life Member";
    }
  | {
      id: 2523;
      color: "purple";
      value: "CRO";
    };
