export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          child_id: string;
          description: string | null;
          id: string;
          name: string;
          unlocked_at: string;
        };
        Insert: {
          child_id: string;
          description?: string | null;
          id?: string;
          name: string;
          unlocked_at?: string;
        };
        Update: {
          child_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      children: {
        Row: {
          age: number | null;
          created_at: string;
          diagnosis_level: string | null;
          id: string;
          learning_goal: string | null;
          name: string;
          parent_id: string;
          teacher_id: string | null;
          therapist_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          age?: number | null;
          created_at?: string;
          diagnosis_level?: string | null;
          id?: string;
          learning_goal?: string | null;
          name: string;
          parent_id: string;
          teacher_id?: string | null;
          therapist_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          age?: number | null;
          created_at?: string;
          diagnosis_level?: string | null;
          id?: string;
          learning_goal?: string | null;
          name?: string;
          parent_id?: string;
          teacher_id?: string | null;
          therapist_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          author_id: string;
          comments: number;
          content: string;
          created_at: string;
          id: string;
          likes: number;
          role: Database["public"]["Enums"]["app_role"] | null;
        };
        Insert: {
          author_id: string;
          comments?: number;
          content: string;
          created_at?: string;
          id?: string;
          likes?: number;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Update: {
          author_id?: string;
          comments?: number;
          content?: string;
          created_at?: string;
          id?: string;
          likes?: number;
          role?: Database["public"]["Enums"]["app_role"] | null;
        };
        Relationships: [];
      };
      emotion_analyses: {
        Row: {
          child_id: string;
          confidence: number | null;
          created_at: string;
          detected_emotion: string | null;
          id: string;
          input_text: string;
          recommendation: string | null;
        };
        Insert: {
          child_id: string;
          confidence?: number | null;
          created_at?: string;
          detected_emotion?: string | null;
          id?: string;
          input_text: string;
          recommendation?: string | null;
        };
        Update: {
          child_id?: string;
          confidence?: number | null;
          created_at?: string;
          detected_emotion?: string | null;
          id?: string;
          input_text?: string;
          recommendation?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emotion_analyses_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      journey_levels: {
        Row: {
          created_at: string;
          description: string;
          icon: string;
          id: string;
          level_order: number;
          title: string;
          updated_at: string;
          xp_reward: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          icon?: string;
          id?: string;
          level_order: number;
          title: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          level_order?: number;
          title?: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      learning_progress: {
        Row: {
          child_id: string;
          communication_score: number;
          completed_missions: number;
          confidence_score: number;
          conversation_score: number;
          created_at: string;
          empathy_score: number;
          greeting_score: number;
          id: string;
          level: number;
          listening_score: number;
          streak: number;
          total_missions: number;
          updated_at: string;
          weekly_goal: number;
          xp: number;
        };
        Insert: {
          child_id: string;
          communication_score?: number;
          completed_missions?: number;
          confidence_score?: number;
          conversation_score?: number;
          created_at?: string;
          empathy_score?: number;
          greeting_score?: number;
          id?: string;
          level?: number;
          listening_score?: number;
          streak?: number;
          total_missions?: number;
          updated_at?: string;
          weekly_goal?: number;
          xp?: number;
        };
        Update: {
          child_id?: string;
          communication_score?: number;
          completed_missions?: number;
          confidence_score?: number;
          conversation_score?: number;
          created_at?: string;
          empathy_score?: number;
          greeting_score?: number;
          id?: string;
          level?: number;
          listening_score?: number;
          streak?: number;
          total_missions?: number;
          updated_at?: string;
          weekly_goal?: number;
          xp?: number;
        };
        Relationships: [
          {
            foreignKeyName: "learning_progress_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      missions: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          mission_type: string;
          target_count: number;
          title: string;
          updated_at: string;
          xp_reward: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_active?: boolean;
          mission_type: string;
          target_count?: number;
          title: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          mission_type?: string;
          target_count?: number;
          title?: string;
          updated_at?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          language_mode: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          language_mode?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          language_mode?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          language: string;
          title: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description: string;
          id?: string;
          is_active?: boolean;
          language?: string;
          title: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          language?: string;
          title?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      simulation_scenarios: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          opening_message: string;
          quick_replies: Json;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_active?: boolean;
          opening_message: string;
          quick_replies?: Json;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          opening_message?: string;
          quick_replies?: Json;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      simulation_sessions: {
        Row: {
          child_id: string;
          conversation: Json;
          created_at: string;
          feedback: string | null;
          id: string;
          scenario: string;
          score: number | null;
          strength: string | null;
          suggestion: string | null;
        };
        Insert: {
          child_id: string;
          conversation?: Json;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          scenario: string;
          score?: number | null;
          strength?: string | null;
          suggestion?: string | null;
        };
        Update: {
          child_id?: string;
          conversation?: Json;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          scenario?: string;
          score?: number | null;
          strength?: string | null;
          suggestion?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "simulation_sessions_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      social_stories: {
        Row: {
          child_id: string;
          created_at: string;
          generated_story: string;
          id: string;
          situation: string;
          title: string;
        };
        Insert: {
          child_id: string;
          created_at?: string;
          generated_story: string;
          id?: string;
          situation: string;
          title: string;
        };
        Update: {
          child_id?: string;
          created_at?: string;
          generated_story?: string;
          id?: string;
          situation?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_stories_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      user_journey_progress: {
        Row: {
          child_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          journey_level_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          child_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          journey_level_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          child_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          journey_level_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_journey_progress_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_journey_progress_journey_level_id_fkey";
            columns: ["journey_level_id"];
            isOneToOne: false;
            referencedRelation: "journey_levels";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          allow_research_data: boolean;
          community_replies: boolean;
          created_at: string;
          daily_mission_reminder: boolean;
          high_contrast: boolean;
          id: string;
          large_font: boolean;
          reduce_motion: boolean;
          screen_reader: boolean;
          share_with_therapist: boolean;
          updated_at: string;
          user_id: string;
          weekly_progress_report: boolean;
        };
        Insert: {
          allow_research_data?: boolean;
          community_replies?: boolean;
          created_at?: string;
          daily_mission_reminder?: boolean;
          high_contrast?: boolean;
          id?: string;
          large_font?: boolean;
          reduce_motion?: boolean;
          screen_reader?: boolean;
          share_with_therapist?: boolean;
          updated_at?: string;
          user_id: string;
          weekly_progress_report?: boolean;
        };
        Update: {
          allow_research_data?: boolean;
          community_replies?: boolean;
          created_at?: string;
          daily_mission_reminder?: boolean;
          high_contrast?: boolean;
          id?: string;
          large_font?: boolean;
          reduce_motion?: boolean;
          screen_reader?: boolean;
          share_with_therapist?: boolean;
          updated_at?: string;
          user_id?: string;
          weekly_progress_report?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_child: { Args: { _child_id: string }; Returns: boolean };
      get_primary_role: {
        Args: { _user_id: string };
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "child" | "parent" | "teacher" | "therapist";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["child", "parent", "teacher", "therapist"],
    },
  },
} as const;
