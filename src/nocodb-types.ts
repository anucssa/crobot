interface NocoDBBaseWebhook {
  id: string;
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
  };
}

interface NocoDBCreatedWebhook extends NocoDBBaseWebhook {
  type: "records.after.insert";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    rows: DBItem[];
  };
}

interface NocoDBUpdatedWebhook extends NocoDBBaseWebhook {
  type: "records.after.update";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    previous_rows: DBItem[];
    rows: DBItem[];
  };
}

interface NocoDBDeletedWebhook extends NocoDBBaseWebhook {
  type: "rows.after.delete";
  data: {
    table_id: string;
    table_name: string;
    view_id: string;
    view_name: string;
    previous_rows: DBItem[];
    rows: DBItem[];
  };
}

export type NocoDBWebhook =
  | NocoDBCreatedWebhook
  | NocoDBUpdatedWebhook
  | NocoDBDeletedWebhook;

export interface DBGetRowsResponse {
  list: [DBItem];
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
  discord_username: string;
  life_member: boolean;
  committee: boolean;
  cro: boolean;
}
