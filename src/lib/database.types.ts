import type { NoteColor } from "./constants";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  created_at: string;
};
export type Note = {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  color: NoteColor;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
export type NoteWithAuthor = Note & { author: Profile | null };
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          username: string;
          display_name: string;
          created_at?: string;
        };
        Update: { username?: string; display_name?: string };
        Relationships: [];
      };
      notes: {
        Row: Note;
        Insert: {
          owner_id: string;
          title: string;
          content: string;
          color?: NoteColor;
          is_public?: boolean;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          color?: NoteColor;
          is_public?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notes_owner_profile_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      ensure_my_profile: { Args: Record<string, never>; Returns: Profile };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
