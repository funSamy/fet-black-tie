export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anonymous_messages: {
        Row: {
          approved_at: string | null
          content: string
          created_at: string
          display_name: string | null
          id: string
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          approved_at?: string | null
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          approved_at?: string | null
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          buyer_name: string
          created_at: string
          external_id: string
          fapshi_payment_link: string | null
          fapshi_trans_id: string | null
          id: string
          medium: string | null
          paid_amount: number | null
          payer_name: string | null
          phone_number: string
          revenue: number | null
          status: Database["public"]["Enums"]["order_status"]
          tier: Database["public"]["Enums"]["ticket_tier"]
          updated_at: string
          user_email: string
        }
        Insert: {
          amount: number
          buyer_name: string
          created_at?: string
          external_id: string
          fapshi_payment_link?: string | null
          fapshi_trans_id?: string | null
          id?: string
          medium?: string | null
          paid_amount?: number | null
          payer_name?: string | null
          phone_number: string
          revenue?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tier: Database["public"]["Enums"]["ticket_tier"]
          updated_at?: string
          user_email: string
        }
        Update: {
          amount?: number
          buyer_name?: string
          created_at?: string
          external_id?: string
          fapshi_payment_link?: string | null
          fapshi_trans_id?: string | null
          id?: string
          medium?: string | null
          paid_amount?: number | null
          payer_name?: string | null
          phone_number?: string
          revenue?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          tier?: Database["public"]["Enums"]["ticket_tier"]
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          first_scan_at: string | null
          id: string
          is_fully_used: boolean
          last_scan_at: string | null
          order_id: string
          qr_slug: string
          slots_total: number
          slots_used: number
        }
        Insert: {
          created_at?: string
          first_scan_at?: string | null
          id?: string
          is_fully_used?: boolean
          last_scan_at?: string | null
          order_id: string
          qr_slug?: string
          slots_total: number
          slots_used?: number
        }
        Update: {
          created_at?: string
          first_scan_at?: string | null
          id?: string
          is_fully_used?: boolean
          last_scan_at?: string | null
          order_id?: string
          qr_slug?: string
          slots_total?: number
          slots_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
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
      message_status: "PENDING" | "APPROVED" | "DELETED"
      order_status: "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED"
      ticket_tier:
        | "CLASSIC"
        | "CLASSIC_COUPLE"
        | "VIP"
        | "VIP_COUPLE"
        | "TABLE_OF_5"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      message_status: ["PENDING", "APPROVED", "DELETED"],
      order_status: ["PENDING", "SUCCESSFUL", "FAILED", "EXPIRED"],
      ticket_tier: [
        "CLASSIC",
        "CLASSIC_COUPLE",
        "VIP",
        "VIP_COUPLE",
        "TABLE_OF_5",
      ],
    },
  },
} as const
