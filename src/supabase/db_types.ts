export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  hotline: {
    Tables: {
      events: {
        Row: {
          extra: Json | null
          id: string
          name: string
        }
        Insert: {
          extra?: Json | null
          id?: string
          name: string
        }
        Update: {
          extra?: Json | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      promos: {
        Row: {
          code: string
          created_at: string | null
          event_id: string | null
          extra: Json | null
        }
        Insert: {
          code?: string
          created_at?: string | null
          event_id?: string | null
          extra?: Json | null
        }
        Update: {
          code?: string
          created_at?: string | null
          event_id?: string | null
          extra?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "promos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          contact_id: string
          created_at: string
          event_id: string | null
          extra: Json | null
          id: string
          promo_code: string | null
          status: Database["hotline"]["Enums"]["ticket_status"] | null
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          event_id?: string | null
          extra?: Json | null
          id?: string
          promo_code?: string | null
          status?: Database["hotline"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_id?: string | null
          extra?: Json | null
          id?: string
          promo_code?: string | null
          status?: Database["hotline"]["Enums"]["ticket_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_promo_code_fkey"
            columns: ["promo_code"]
            isOneToOne: true
            referencedRelation: "promos"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ticket_status: "reserved" | "assigned" | "used" | "returned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agents: {
        Row: {
          ai: boolean
          created_at: string
          extra: Json | null
          id: string
          name: string
          organization_id: string | null
          picture: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai: boolean
          created_at?: string
          extra?: Json | null
          id?: string
          name: string
          organization_id?: string | null
          picture?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai?: boolean
          created_at?: string
          extra?: Json | null
          id?: string
          name?: string
          organization_id?: string | null
          picture?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          extra: Json | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          extra?: Json | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          extra?: Json | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          contact_address: string
          contact_id: string | null
          created_at: string
          extra: Json | null
          name: string
          organization_address: string
          organization_id: string
          service: Database["public"]["Enums"]["service"]
          updated_at: string
        }
        Insert: {
          contact_address: string
          contact_id?: string | null
          created_at?: string
          extra?: Json | null
          name: string
          organization_address: string
          organization_id: string
          service: Database["public"]["Enums"]["service"]
          updated_at?: string
        }
        Update: {
          contact_address?: string
          contact_id?: string | null
          created_at?: string
          extra?: Json | null
          name?: string
          organization_address?: string
          organization_id?: string
          service?: Database["public"]["Enums"]["service"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_address_fkey"
            columns: ["organization_address"]
            isOneToOne: false
            referencedRelation: "organizations_addresses"
            referencedColumns: ["address"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string | null
          contact_address: string
          created_at: string
          direction: Database["public"]["Enums"]["direction"] | null
          external_id: string | null
          id: string
          message: Json
          organization_address: string
          service: Database["public"]["Enums"]["service"]
          status: Json
          timestamp: string
          type: Database["public"]["Enums"]["type"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          contact_address: string
          created_at?: string
          direction?: Database["public"]["Enums"]["direction"] | null
          external_id?: string | null
          id?: string
          message: Json
          organization_address: string
          service: Database["public"]["Enums"]["service"]
          status?: Json
          timestamp?: string
          type: Database["public"]["Enums"]["type"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          contact_address?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["direction"] | null
          external_id?: string | null
          id?: string
          message?: Json
          organization_address?: string
          service?: Database["public"]["Enums"]["service"]
          status?: Json
          timestamp?: string
          type?: Database["public"]["Enums"]["type"]
          updated_at?: string
        }
        Relationships: []
      }
      model_usage: {
        Row: {
          contact_address: string
          message_id: string
          model: string
          organization_address: string
          organization_id: string
          stats: Json
          timestamp: string
        }
        Insert: {
          contact_address: string
          message_id: string
          model: string
          organization_address: string
          organization_id: string
          stats: Json
          timestamp?: string
        }
        Update: {
          contact_address?: string
          message_id?: string
          model?: string
          organization_address?: string
          organization_id?: string
          stats?: Json
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_conversation"
            columns: ["organization_address", "contact_address"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["organization_address", "contact_address"]
          },
          {
            foreignKeyName: "fk_message"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          extra: Json | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          extra?: Json | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          extra?: Json | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      organizations_addresses: {
        Row: {
          address: string
          created_at: string
          extra: Json | null
          organization_id: string
          service: Database["public"]["Enums"]["service"]
          status: string
        }
        Insert: {
          address: string
          created_at?: string
          extra?: Json | null
          organization_id: string
          service: Database["public"]["Enums"]["service"]
          status?: string
        }
        Update: {
          address?: string
          created_at?: string
          extra?: Json | null
          organization_id?: string
          service?: Database["public"]["Enums"]["service"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          id: string
          operations: Database["public"]["Enums"]["webhook_operation"][]
          organization_id: string
          table_name: Database["public"]["Enums"]["webhook_table"]
          token: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          operations?: Database["public"]["Enums"]["webhook_operation"][]
          organization_id: string
          table_name: Database["public"]["Enums"]["webhook_table"]
          token?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          operations?: Database["public"]["Enums"]["webhook_operation"][]
          organization_id?: string
          table_name?: Database["public"]["Enums"]["webhook_table"]
          token?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_messages_status: {
        Args: { records: Json }
        Returns: undefined
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      generate_unique_promo_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_authorized_org_by_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_authorized_orgs: {
        Args: Record<PropertyKey, never> | { role: string }
        Returns: string[]
      }
      merge_update_jsonb: {
        Args: { target: Json; path: string[]; object: Json }
        Returns: Json
      }
      read_secret: {
        Args: { _name: string }
        Returns: string
      }
      text2timestamp: {
        Args: { text: string }
        Returns: string
      }
    }
    Enums: {
      direction: "incoming" | "outgoing" | "internal"
      service:
        | "whatsapp"
        | "instagram"
        | "telegram"
        | "web"
        | "email"
        | "local"
      type:
        | "incoming"
        | "outgoing"
        | "draft"
        | "notification"
        | "function_call"
        | "function_response"
        | "internal"
      webhook_action: "INSERT" | "UPDATE"
      webhook_entity: "messages" | "conversations"
      webhook_operation: "INSERT" | "UPDATE"
      webhook_table: "messages" | "conversations"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  hotline: {
    Enums: {
      ticket_status: ["reserved", "assigned", "used", "returned"],
    },
  },
  public: {
    Enums: {
      direction: ["incoming", "outgoing", "internal"],
      service: [
        "whatsapp",
        "instagram",
        "telegram",
        "web",
        "email",
        "local",
      ],
      type: [
        "incoming",
        "outgoing",
        "draft",
        "notification",
        "function_call",
        "function_response",
        "internal",
      ],
      webhook_action: ["INSERT", "UPDATE"],
      webhook_entity: ["messages", "conversations"],
      webhook_operation: ["INSERT", "UPDATE"],
      webhook_table: ["messages", "conversations"],
    },
  },
  storage: {
    Enums: {},
  },
} as const

