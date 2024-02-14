type Nullable<T> = T | null;

declare namespace Baserow {
  interface BaseWebhook {
    table_id: 511;
    database_id: 97;
    workspace_id: 96;
    event_id: string;
  }

  interface CreatedWebhook extends BaseWebhook {
    event_type: "rows.created";
    items: Item[];
  }

  interface UpdatedWebhook extends BaseWebhook {
    event_type: "rows.updated";
    items: Item[];
    old_items: Item[];
  }

  interface DeletedWebhook extends BaseWebhook {
    event_type: "rows.deleted";
    row_ids: number[];
  }

  export type Webhook = CreatedWebhook | UpdatedWebhook | DeletedWebhook;

  interface Item {
    id: number;
    order: string;
    // Member ID
    [ITEM_FIELDS.ID]: string;
    // First Name
    [ITEM_FIELDS.FIRST_NAME]: Nullable<string>;
    // Last Name
    [ITEM_FIELDS.LAST_NAME]: Nullable<string>;
    // UID
    [ITEM_FIELDS.UID]: Nullable<string>;
    // Email
    [ITEM_FIELDS.EMAIL]: Nullable<string>;
    // Flags
    [ITEM_FIELDS.FLAGS]: Flags[];
    // Membership Card Number
    [ITEM_FIElDS.MEMBERSHIP_CARD_NUMBER]: Nullable<string>;
    // Created At
    [ITEM_FIELDS.CREATED_AT]: Date;
    // Discord Username
    [ITEM_FIELDS.DISCORD_USERNAME]: Nullable<string>;
  }

  export enum ITEM_FIELDS {
    ID = "field_4740",
    FIRST_NAME = "field_4741",
    LAST_NAME = "field_4742",
    UID = "field_4743",
    EMAIL = "field_4744",
    FLAGS = "field_4746",
    MEMBERSHIP_CARD_NUMBER = "field_4748",
    CREATED_AT = "field_4749",
    DISCORD_USERNAME = "field_4760",
  }

  type Flags =
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
}
