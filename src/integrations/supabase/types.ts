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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          shortcut: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          shortcut: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          shortcut?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_approved: boolean
          name: string
          parent_id: string | null
          slug: string
          suggested_by: string | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_approved?: boolean
          name: string
          parent_id?: string | null
          slug: string
          suggested_by?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_approved?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          suggested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string
          id: string
          is_active: boolean
          max_uses: number | null
          vendor_id: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          expires_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          vendor_id: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_search"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_access: {
        Row: {
          created_at: string
          deal_closed: boolean
          deal_closed_at: string | null
          deal_value: number | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          quote_id: string
          unlocked_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          deal_closed?: boolean
          deal_closed_at?: string | null
          deal_value?: number | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quote_id: string
          unlocked_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          deal_closed?: boolean
          deal_closed_at?: string | null
          deal_value?: number | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          quote_id?: string
          unlocked_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_access_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_access_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          id: string
          leads_access_id: string
          stripe_session_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          leads_access_id: string
          stripe_session_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          leads_access_id?: string
          stripe_session_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_leads_access_id_fkey"
            columns: ["leads_access_id"]
            isOneToOne: false
            referencedRelation: "leads_access"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          whatsapp?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          pax_count: number
          status: Database["public"]["Enums"]["quote_status"]
          vendor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          pax_count: number
          status?: Database["public"]["Enums"]["quote_status"]
          vendor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          pax_count?: number
          status?: Database["public"]["Enums"]["quote_status"]
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_date: string | null
          id: string
          quote_id: string
          rating: number
          reviewer_id: string
          target_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          quote_id: string
          rating: number
          reviewer_id: string
          target_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_date?: string | null
          id?: string
          quote_id?: string
          rating?: number
          reviewer_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_credits: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          quote_id: string | null
          stripe_session_id: string | null
          transaction_type: string
          vendor_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          quote_id?: string | null
          stripe_session_id?: string | null
          transaction_type: string
          vendor_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          quote_id?: string | null
          stripe_session_id?: string | null
          transaction_type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_credits_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          business_name: string
          category: Database["public"]["Enums"]["vendor_category"]
          category_id: string | null
          created_at: string
          custom_category: string | null
          description: string | null
          id: string
          images: string[] | null
          is_approved: boolean
          neighborhood: string | null
          profile_id: string
          rejection_reason: string | null
          stripe_customer_id: string | null
          submitted_at: string | null
          subscription_expiry: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name: string
          category?: Database["public"]["Enums"]["vendor_category"]
          category_id?: string | null
          created_at?: string
          custom_category?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          neighborhood?: string | null
          profile_id: string
          rejection_reason?: string | null
          stripe_customer_id?: string | null
          submitted_at?: string | null
          subscription_expiry?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          business_name?: string
          category?: Database["public"]["Enums"]["vendor_category"]
          category_id?: string | null
          created_at?: string
          custom_category?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_approved?: boolean
          neighborhood?: string | null
          profile_id?: string
          rejection_reason?: string | null
          stripe_customer_id?: string | null
          submitted_at?: string | null
          subscription_expiry?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vendors_public: {
        Row: {
          business_name: string | null
          category: Database["public"]["Enums"]["vendor_category"] | null
          category_id: string | null
          created_at: string | null
          custom_category: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_approved: boolean | null
          neighborhood: string | null
          profile_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Insert: {
          business_name?: string | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          category_id?: string | null
          created_at?: string | null
          custom_category?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          neighborhood?: string | null
          profile_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Update: {
          business_name?: string | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          category_id?: string | null
          created_at?: string | null
          custom_category?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          neighborhood?: string | null
          profile_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors_search: {
        Row: {
          active_coupons_count: number | null
          approved_at: string | null
          avg_rating: number | null
          business_name: string | null
          category: Database["public"]["Enums"]["vendor_category"] | null
          category_id: string | null
          created_at: string | null
          custom_category: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_approved: boolean | null
          neighborhood: string | null
          profile_id: string | null
          review_count: number | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Insert: {
          active_coupons_count?: never
          approved_at?: string | null
          avg_rating?: never
          business_name?: string | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          category_id?: string | null
          created_at?: string | null
          custom_category?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          neighborhood?: string | null
          profile_id?: string | null
          review_count?: never
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Update: {
          active_coupons_count?: never
          approved_at?: string | null
          avg_rating?: never
          business_name?: string | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          category_id?: string | null
          created_at?: string | null
          custom_category?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_approved?: boolean | null
          neighborhood?: string | null
          profile_id?: string | null
          review_count?: never
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_expiring_bonus_credits: {
        Args: { p_vendor_id: string }
        Returns: {
          amount: number
          days_remaining: number
          expires_at: string
        }[]
      }
      get_vendor_available_balance: {
        Args: { p_vendor_id: string }
        Returns: number
      }
      get_vendor_balance: { Args: { p_vendor_id: string }; Returns: number }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      use_credit_atomic: {
        Args: { p_quote_id: string; p_vendor_id: string }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "admin" | "moderator" | "user"
      app_role: "vendor" | "client"
      payment_status: "pending" | "paid"
      quote_status: "open" | "unlocked" | "completed" | "cancelled"
      subscription_status: "active" | "inactive" | "past_due"
      vendor_category:
        | "confeitaria"
        | "doces"
        | "salgados"
        | "decoracao"
        | "outros"
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
      admin_role: ["admin", "moderator", "user"],
      app_role: ["vendor", "client"],
      payment_status: ["pending", "paid"],
      quote_status: ["open", "unlocked", "completed", "cancelled"],
      subscription_status: ["active", "inactive", "past_due"],
      vendor_category: [
        "confeitaria",
        "doces",
        "salgados",
        "decoracao",
        "outros",
      ],
    },
  },
} as const
