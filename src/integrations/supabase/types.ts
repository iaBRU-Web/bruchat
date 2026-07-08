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
      achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_actions_log: {
        Row: {
          action_type: string
          details: Json | null
          id: string
          performed_at: string
          performed_by: string
          target_content_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string
          target_content_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          announcement_text: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          promo_end_date: string | null
          promo_free_verification: boolean
          updated_at: string
        }
        Insert: {
          announcement_text?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          promo_end_date?: string | null
          promo_free_verification?: boolean
          updated_at?: string
        }
        Update: {
          announcement_text?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          promo_end_date?: string | null
          promo_free_verification?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      auto_moderation_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rule_type: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          value?: string
        }
        Relationships: []
      }
      bans: {
        Row: {
          banned_at: string
          banned_by: string
          id: string
          reason: string | null
          unbanned_at: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          disappearing_messages_duration: string | null
          id: string
          is_archived_a: boolean | null
          is_archived_b: boolean | null
          is_muted_a: boolean | null
          is_muted_b: boolean | null
          is_pinned_a: boolean | null
          is_pinned_b: boolean | null
          last_message_at: string | null
          participant_a: string
          participant_b: string
        }
        Insert: {
          created_at?: string | null
          disappearing_messages_duration?: string | null
          id?: string
          is_archived_a?: boolean | null
          is_archived_b?: boolean | null
          is_muted_a?: boolean | null
          is_muted_b?: boolean | null
          is_pinned_a?: boolean | null
          is_pinned_b?: boolean | null
          last_message_at?: string | null
          participant_a: string
          participant_b: string
        }
        Update: {
          created_at?: string | null
          disappearing_messages_duration?: string | null
          id?: string
          is_archived_a?: boolean | null
          is_archived_b?: boolean | null
          is_muted_a?: boolean | null
          is_muted_b?: boolean | null
          is_pinned_a?: boolean | null
          is_pinned_b?: boolean | null
          last_message_at?: string | null
          participant_a?: string
          participant_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          content: string | null
          conversation_id: string | null
          group_id: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          group_id?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          group_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_message_reads: {
        Row: {
          group_message_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          group_message_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          group_message_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_message_reads_group_message_id_fkey"
            columns: ["group_message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string | null
          edited_at: string | null
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          group_id: string
          id: string
          image_url: string | null
          is_deleted: boolean | null
          is_edited: boolean | null
          is_pinned: boolean | null
          link_preview_description: string | null
          link_preview_image: string | null
          link_preview_title: string | null
          link_preview_url: string | null
          mentions: string[] | null
          message_type: string | null
          reply_to_id: string | null
          sender_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          link_preview_description?: string | null
          link_preview_image?: string | null
          link_preview_title?: string | null
          link_preview_url?: string | null
          mentions?: string[] | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          link_preview_description?: string | null
          link_preview_image?: string | null
          link_preview_title?: string | null
          link_preview_url?: string | null
          mentions?: string[] | null
          message_type?: string | null
          reply_to_id?: string | null
          sender_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          disappearing_messages_duration: string | null
          id: string
          invite_link: string | null
          is_public: boolean | null
          max_members: number | null
          name: string
          slow_mode_duration: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          disappearing_messages_duration?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          max_members?: number | null
          name: string
          slow_mode_duration?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          disappearing_messages_duration?: string | null
          id?: string
          invite_link?: string | null
          is_public?: boolean | null
          max_members?: number | null
          name?: string
          slow_mode_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string | null
          conversation_id: string
          created_at: string | null
          edited_at: string | null
          encrypted: boolean | null
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          is_edited: boolean | null
          is_pinned: boolean | null
          is_read: boolean | null
          is_scheduled: boolean | null
          is_starred: boolean | null
          is_view_once: boolean | null
          is_view_once_opened: boolean | null
          link_preview_description: string | null
          link_preview_image: string | null
          link_preview_title: string | null
          link_preview_url: string | null
          message_type: string | null
          read_at: string | null
          reply_to_id: string | null
          scheduled_for: string | null
          scheduled_status: string | null
          sender_content: string | null
          sender_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string | null
          edited_at?: string | null
          encrypted?: boolean | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          is_scheduled?: boolean | null
          is_starred?: boolean | null
          is_view_once?: boolean | null
          is_view_once_opened?: boolean | null
          link_preview_description?: string | null
          link_preview_image?: string | null
          link_preview_title?: string | null
          link_preview_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          scheduled_for?: string | null
          scheduled_status?: string | null
          sender_content?: string | null
          sender_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          edited_at?: string | null
          encrypted?: boolean | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_read?: boolean | null
          is_scheduled?: boolean | null
          is_starred?: boolean | null
          is_view_once?: boolean | null
          is_view_once_opened?: boolean | null
          link_preview_description?: string | null
          link_preview_image?: string | null
          link_preview_title?: string | null
          link_preview_url?: string | null
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          scheduled_for?: string | null
          scheduled_status?: string | null
          sender_content?: string | null
          sender_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          from_user_id: string | null
          group_id: string | null
          id: string
          is_read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          from_user_id?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          group_id: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          group_id: string
          id?: string
          options?: Json
          question: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_id: string
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id: string
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          image_urls: Json | null
          is_public: boolean | null
          likes_count: number | null
          post_type: string | null
          reposted_from_id: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_urls?: Json | null
          is_public?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          reposted_from_id?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_urls?: Json | null
          is_public?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          reposted_from_id?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          away_status: string | null
          banner_url: string | null
          bio: string | null
          bubble_style: string | null
          chat_wallpaper: string | null
          created_at: string | null
          desktop_notifications: boolean | null
          display_name: string
          font_size: string | null
          id: string
          is_banned: boolean | null
          is_online: boolean | null
          last_seen: string | null
          post_limit_override: number | null
          profile_views: number | null
          public_key: string | null
          show_last_seen: boolean | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          show_typing: boolean | null
          sound_notifications: boolean | null
          status_text: string | null
          theme: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          away_status?: string | null
          banner_url?: string | null
          bio?: string | null
          bubble_style?: string | null
          chat_wallpaper?: string | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          display_name?: string
          font_size?: string | null
          id: string
          is_banned?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          post_limit_override?: number | null
          profile_views?: number | null
          public_key?: string | null
          show_last_seen?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing?: boolean | null
          sound_notifications?: boolean | null
          status_text?: string | null
          theme?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          away_status?: string | null
          banner_url?: string | null
          bio?: string | null
          bubble_style?: string | null
          chat_wallpaper?: string | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          display_name?: string
          font_size?: string | null
          id?: string
          is_banned?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          post_limit_override?: number | null
          profile_views?: number | null
          public_key?: string | null
          show_last_seen?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing?: boolean | null
          sound_notifications?: boolean | null
          status_text?: string | null
          theme?: string | null
          username?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          emoji: string
          group_message_id: string | null
          id: string
          message_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          group_message_id?: string | null
          id?: string
          message_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          group_message_id?: string | null
          id?: string
          message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_resolved: boolean | null
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      starred_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          group_id: string | null
          group_message_id: string | null
          id: string
          message_id: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          group_id?: string | null
          group_message_id?: string | null
          id?: string
          message_id?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          group_id?: string | null
          group_message_id?: string | null
          id?: string
          message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "starred_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_group_message_id_fkey"
            columns: ["group_message_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "starred_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          password_plain: string
          updated_at: string
          user_id: string
        }
        Insert: {
          password_plain?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          password_plain?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          bio_text: string | null
          category: string | null
          created_at: string
          follower_count_at_apply: number | null
          full_name: string | null
          id: string
          notable_work: string | null
          reason: string
          reviewed_at: string | null
          social_links: string | null
          status: string
          step_completed: number | null
          user_id: string
        }
        Insert: {
          bio_text?: string | null
          category?: string | null
          created_at?: string
          follower_count_at_apply?: number | null
          full_name?: string | null
          id?: string
          notable_work?: string | null
          reason?: string
          reviewed_at?: string | null
          social_links?: string | null
          status?: string
          step_completed?: number | null
          user_id: string
        }
        Update: {
          bio_text?: string | null
          category?: string | null
          created_at?: string
          follower_count_at_apply?: number | null
          full_name?: string | null
          id?: string
          notable_work?: string | null
          reason?: string
          reviewed_at?: string | null
          social_links?: string | null
          status?: string
          step_completed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      verified_users: {
        Row: {
          badge_type: string
          id: string
          user_id: string
          verified_at: string
        }
        Insert: {
          badge_type?: string
          id?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          badge_type?: string
          id?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      warnings: {
        Row: {
          id: string
          reason: string | null
          user_id: string
          warned_at: string
          warned_by: string
        }
        Insert: {
          id?: string
          reason?: string | null
          user_id: string
          warned_at?: string
          warned_by?: string
        }
        Update: {
          id?: string
          reason?: string | null
          user_id?: string
          warned_at?: string
          warned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_comments: {
        Row: {
          content: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content?: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_shorts: {
        Row: {
          created_at: string
          id: string
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_blocked: {
        Args: { _blocked: string; _blocker: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
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
