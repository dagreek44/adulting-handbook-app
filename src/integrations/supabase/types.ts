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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      device_tokens: {
        Row: {
          created_at: string
          device_platform: string
          fcm_token: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_platform: string
          fcm_token: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_platform?: string
          fcm_token?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      family_invitations: {
        Row: {
          created_at: string
          expires_at: string
          family_id: string
          id: string
          invitee_email: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          family_id: string
          id?: string
          invitee_email: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          invitee_email?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          adulting_progress: number | null
          created_at: string
          email: string
          family_id: string | null
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
          family_id?: string | null
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
          family_id?: string | null
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
      friend_group_invitations: {
        Row: {
          created_at: string
          expires_at: string
          group_id: string
          id: string
          invitee_email: string
          inviter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          group_id: string
          id?: string
          invitee_email: string
          inviter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          group_id?: string
          id?: string
          invitee_email?: string
          inviter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "friend_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_group_members: {
        Row: {
          created_at: string
          email: string
          group_id: string
          id: string
          invited_by: string | null
          name: string
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          group_id: string
          id?: string
          invited_by?: string | null
          name: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          group_id?: string
          id?: string
          invited_by?: string | null
          name?: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "friend_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          max_members: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          max_members?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          max_members?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          outbox_id: string | null
          payload: Json | null
          recipient_user_id: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          outbox_id?: string | null
          payload?: Json | null
          recipient_user_id: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          outbox_id?: string | null
          payload?: Json | null
          recipient_user_id?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          attempts: number
          body: string
          created_at: string
          data: Json | null
          id: string
          last_error: string | null
          max_attempts: number
          next_attempt_at: string
          notification_type: string
          recipient_user_id: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          notification_type: string
          recipient_user_id: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_attempt_at?: string
          notification_type?: string
          recipient_user_id?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          "Email Address": string | null
          family_id: string
          first_login: boolean | null
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
          first_login?: boolean | null
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
          first_login?: boolean | null
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
          main_category: string | null
          subcategory: string | null
          supplies: Json | null
          title: string
          tools: Json | null
          updated_at: string
          video_url: string | null
          why: string | null
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
          main_category?: string | null
          subcategory?: string | null
          supplies?: Json | null
          title: string
          tools?: Json | null
          updated_at?: string
          video_url?: string | null
          why?: string | null
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
          main_category?: string | null
          subcategory?: string | null
          supplies?: Json | null
          title?: string
          tools?: Json | null
          updated_at?: string
          video_url?: string | null
          why?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          created_at: string
          family_id: string
          id: string
          is_unlocked: boolean
          max_progress: number
          progress: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          created_at?: string
          family_id: string
          id?: string
          is_unlocked?: boolean
          max_progress?: number
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          created_at?: string
          family_id?: string
          id?: string
          is_unlocked?: boolean
          max_progress?: number
          progress?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_by: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          due_date: string
          enabled: boolean
          estimated_budget: string | null
          estimated_time: string | null
          family_id: string
          frequency: string
          frequency_days: number | null
          group_id: string | null
          id: string
          instructions: string[] | null
          is_custom: boolean | null
          last_completed: string | null
          reminder_id: string | null
          reminder_type: string
          status: string | null
          supplies: Json | null
          title: string | null
          tools: Json | null
          user_id: string | null
          video_url: string | null
          why: string | null
        }
        Insert: {
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          due_date: string
          enabled?: boolean
          estimated_budget?: string | null
          estimated_time?: string | null
          family_id: string
          frequency: string
          frequency_days?: number | null
          group_id?: string | null
          id?: string
          instructions?: string[] | null
          is_custom?: boolean | null
          last_completed?: string | null
          reminder_id?: string | null
          reminder_type?: string
          status?: string | null
          supplies?: Json | null
          title?: string | null
          tools?: Json | null
          user_id?: string | null
          video_url?: string | null
          why?: string | null
        }
        Update: {
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          due_date?: string
          enabled?: boolean
          estimated_budget?: string | null
          estimated_time?: string | null
          family_id?: string
          frequency?: string
          frequency_days?: number | null
          group_id?: string | null
          id?: string
          instructions?: string[] | null
          is_custom?: boolean | null
          last_completed?: string | null
          reminder_id?: string | null
          reminder_type?: string
          status?: string | null
          supplies?: Json | null
          title?: string | null
          tools?: Json | null
          user_id?: string | null
          video_url?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "friend_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          family_id: string
          first_name: string
          id: string
          last_name: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          family_id?: string
          first_name: string
          id?: string
          last_name: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          family_id?: string
          first_name?: string
          id?: string
          last_name?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_family_invitation: {
        Args: { invitation_email: string }
        Returns: string
      }
      accept_friend_group_invitation: {
        Args: { p_invitation_email: string }
        Returns: undefined
      }
      calculate_next_due_date: {
        Args: { completed_date: string; frequency: string }
        Returns: string
      }
      enqueue_notification: {
        Args: {
          p_body: string
          p_data?: Json
          p_notification_type: string
          p_recipient_user_id: string
          p_sender_user_id: string
          p_title: string
        }
        Returns: string
      }
      get_user_family_id: { Args: { user_id: string }; Returns: string }
      get_user_group_ids: { Args: { p_user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_creator: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      update_badge_progress: {
        Args: {
          p_badge_key: string
          p_family_id: string
          p_max_progress: number
          p_progress: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "parent" | "child"
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
      app_role: ["parent", "child"],
    },
  },
} as const
