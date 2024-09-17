interface NocoDBBaseWebhook {
  id: string;
  type: unknown;
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
  };
}

interface NocoDBCreatedWebhook<ItemType extends DBItem>
  extends NocoDBBaseWebhook {
  type: "records.after.insert";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    rows: ItemType[];
  };
}

interface NocoDBUpdatedWebhook<ItemType extends DBItem>
  extends NocoDBBaseWebhook {
  type: "records.after.update";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    previous_rows: ItemType[];
    rows: ItemType[];
  };
}

interface NocoDBDeletedWebhook<ItemType extends DBItem>
  extends NocoDBBaseWebhook {
  type: "rows.after.delete";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    previous_rows: ItemType[];
    rows: ItemType[];
  };
}

export type NocoDBWebhook<ItemType extends DBItem> =
  | NocoDBCreatedWebhook<ItemType>
  | NocoDBUpdatedWebhook<ItemType>
  | NocoDBDeletedWebhook<ItemType>;

export interface DBGetRowsResponse<ItemType extends DBItem> {
  list: [ItemType];
  PageInfo: [DBPageInfo];
}

export interface DBPageInfo {
  pageSize: number;
  totalRows: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  page: number;
}

export interface DBItem {
  id: number;
}

export interface MembershipDBItem extends DBItem {
  discord_username: string;
  life_member: boolean;
  committee: boolean;
  cro: boolean;
}

export interface QuoteDBItem extends DBItem {
  quote: string;
  author?: string;
}
