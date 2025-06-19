export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      family_members: {
        Row: {
          adulting_progress: number | null
          created_at: string
          email: string
          id: string
          invited_at: string
          name: string
          profile_id: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          adulting_progress?: number | null
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          name: string
          profile_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          adulting_progress?: number | null
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          name?: string
          profile_id?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          "Email Address": string | null
          family_id: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          "Email Address"?: string | null
          family_id?: string
          first_name: string
          id: string
          last_name: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          "Email Address"?: string | null
          family_id?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          assignees: string[] | null
          created_at: string
          description: string | null
          difficulty: string | null
          due_date: string | null
          enabled: boolean | null
          estimated_budget: string | null
          estimated_time: string | null
          family_id: string | null
          frequency: string
          id: string
          instructions: string[] | null
          is_custom: boolean | null
          supplies: Json | null
          title: string
          tools: Json | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          assignees?: string[] | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          enabled?: boolean | null
          estimated_budget?: string | null
          estimated_time?: string | null
          family_id?: string | null
          frequency: string
          id?: string
          instructions?: string[] | null
          is_custom?: boolean | null
          supplies?: Json | null
          title: string
          tools?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          assignees?: string[] | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          due_date?: string | null
          enabled?: boolean | null
          estimated_budget?: string | null
          estimated_time?: string | null
          family_id?: string | null
          frequency?: string
          id?: string
          instructions?: string[] | null
          is_custom?: boolean | null
          supplies?: Json | null
          title?: string
          tools?: Json | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_date: string | null
          created_at: string
          due_date: string
          enabled: boolean
          family_id: string
          frequency: string
          id: string
          reminder_id: string
          reminder_type: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          due_date: string
          enabled?: boolean
          family_id: string
          frequency: string
          id?: string
          reminder_id: string
          reminder_type?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          due_date?: string
          enabled?: boolean
          family_id?: string
          frequency?: string
          id?: string
          reminder_id?: string
          reminder_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_due_date: {
        Args: { completed_date: string; frequency: string }
        Returns: string
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
  public: {
    Enums: {},
  },
} as const
