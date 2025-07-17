export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      batch_orders: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_payments: {
        Row: {
          amount: number
          cashier_id: string
          change_amount: number
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          received_amount: number
        }
        Insert: {
          amount: number
          cashier_id: string
          change_amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          received_amount: number
        }
        Update: {
          amount?: number
          cashier_id?: string
          change_amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          received_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          class_name: string
          created_at: string
          id: string
          name: string
          nik: string | null
          nis: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          name: string
          nik?: string | null
          nis?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          name?: string
          nik?: string | null
          nis?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          order_id: string | null
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          order_id?: string | null
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_line_items: {
        Row: {
          child_class: string | null
          child_id: string | null
          child_name: string
          created_at: string | null
          delivery_date: string
          id: string
          menu_item_id: string
          notes: string | null
          order_date: string
          order_id: string
          quantity: number
          total_price: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          child_class?: string | null
          child_id?: string | null
          child_name: string
          created_at?: string | null
          delivery_date: string
          id?: string
          menu_item_id: string
          notes?: string | null
          order_date?: string
          order_id: string
          quantity?: number
          total_price?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          child_class?: string | null
          child_id?: string | null
          child_name?: string
          created_at?: string | null
          delivery_date?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          order_date?: string
          order_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_line_items_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_line_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_line_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_schedules: {
        Row: {
          created_at: string
          current_orders: number | null
          cutoff_date: string | null
          cutoff_time: string | null
          date: string
          id: string
          is_blocked: boolean | null
          max_orders: number | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_orders?: number | null
          cutoff_date?: string | null
          cutoff_time?: string | null
          date: string
          id?: string
          is_blocked?: boolean | null
          max_orders?: number | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_orders?: number | null
          cutoff_date?: string | null
          cutoff_time?: string | null
          date?: string
          id?: string
          is_blocked?: boolean | null
          max_orders?: number | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          child_class: string | null
          child_name: string | null
          created_at: string
          delivery_date: string | null
          id: string
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          notes: string | null
          order_date: string | null
          order_number: string
          parent_notes: string | null
          payment_method: string | null
          payment_status: string | null
          snap_token: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          child_class?: string | null
          child_name?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          notes?: string | null
          order_date?: string | null
          order_number: string
          parent_notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          snap_token?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          child_class?: string | null
          child_name?: string | null
          created_at?: string
          delivery_date?: string | null
          id?: string
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          notes?: string | null
          order_date?: string | null
          order_number?: string
          parent_notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          snap_token?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          midtrans_response: Json | null
          order_id: string | null
          payment_method: string
          status: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          midtrans_response?: Json | null
          order_id?: string | null
          payment_method: string
          status?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          midtrans_response?: Json | null
          order_id?: string | null
          payment_method?: string
          status?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_name: string | null
          created_at: string
          id: string
          name: string
          nik: string
          nis: string | null
          updated_at: string
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          id?: string
          name: string
          nik: string
          nis?: string | null
          updated_at?: string
        }
        Update: {
          class_name?: string | null
          created_at?: string
          id?: string
          name?: string
          nik?: string
          nis?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_user_profiles: {
        Row: {
          address: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never> | { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
