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
      completed_tasks: {
        Row: {
          completed_at: string
          created_at: string
          description: string | null
          difficulty: string | null
          estimated_budget: string | null
          estimated_time: string | null
          id: string
          reminder_id: string | null
          title: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_budget?: string | null
          estimated_time?: string | null
          id?: string
          reminder_id?: string | null
          title: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          estimated_budget?: string | null
          estimated_time?: string | null
          id?: string
          reminder_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_tasks_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
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
      Reminders: {
        Row: {
          Cost: number | null
          created_at: string
          Description: string | null
          Difficulty: string | null
          DueDate: string | null
          EstimatedTime: string | null
          Frequency: string | null
          id: number
          Instructions: string | null
          LastCompleted: string | null
          TimesCompleted: number | null
          Title: string | null
          Video: string | null
        }
        Insert: {
          Cost?: number | null
          created_at?: string
          Description?: string | null
          Difficulty?: string | null
          DueDate?: string | null
          EstimatedTime?: string | null
          Frequency?: string | null
          id?: number
          Instructions?: string | null
          LastCompleted?: string | null
          TimesCompleted?: number | null
          Title?: string | null
          Video?: string | null
        }
        Update: {
          Cost?: number | null
          created_at?: string
          Description?: string | null
          Difficulty?: string | null
          DueDate?: string | null
          EstimatedTime?: string | null
          Frequency?: string | null
          id?: number
          Instructions?: string | null
          LastCompleted?: string | null
          TimesCompleted?: number | null
          Title?: string | null
          Video?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
