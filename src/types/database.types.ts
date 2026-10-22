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
    PostgrestVersion: "14.18"
  }
  app_private: {
    Tables: {
      audit_entries: {
        Row: {
          action: string
          actor_staff_id: string | null
          actor_user_id: string
          changed_fields: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          operation_id: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_staff_id?: string | null
          actor_user_id: string
          changed_fields?: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          operation_id?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_staff_id?: string | null
          actor_user_id?: string
          changed_fields?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          operation_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_entries_actor_staff_id_fkey"
            columns: ["actor_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          access_key_expires_at: string | null
          access_key_hash: string | null
          auth_user_id: string | null
          contact_phone: string | null
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          display_name: string | null
          frequent_instructions: string
          id: string
          revision: number
          status: string
          terms_accepted_at: string
          terms_version: string
          updated_at: string
        }
        Insert: {
          access_key_expires_at?: string | null
          access_key_hash?: string | null
          auth_user_id?: string | null
          contact_phone?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string | null
          frequent_instructions?: string
          id?: string
          revision?: number
          status?: string
          terms_accepted_at?: string
          terms_version: string
          updated_at?: string
        }
        Update: {
          access_key_expires_at?: string | null
          access_key_hash?: string | null
          auth_user_id?: string | null
          contact_phone?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string | null
          frequent_instructions?: string
          id?: string
          revision?: number
          status?: string
          terms_accepted_at?: string
          terms_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_cards: {
        Row: {
          created_at: string
          customer_id: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          net_stamps: number
          program_version_id: string
          revision: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          net_stamps?: number
          program_version_id: string
          revision?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          net_stamps?: number
          program_version_id?: string
          revision?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_cards_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_cards_program_version_id_fkey"
            columns: ["program_version_id"]
            isOneToOne: false
            referencedRelation: "loyalty_program_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_events: {
        Row: {
          actor_staff_id: string
          card_id: string
          event_type: string
          id: string
          occurred_at: string
          operation_id: string
          reason: string | null
          recorded_at: string
          reinstates_event_id: string | null
          reverses_event_id: string | null
          reward_cost_cents_snapshot: number | null
          reward_id: string | null
          stamp_delta: number
          visit_reference: string | null
        }
        Insert: {
          actor_staff_id: string
          card_id: string
          event_type: string
          id?: string
          occurred_at?: string
          operation_id: string
          reason?: string | null
          recorded_at?: string
          reinstates_event_id?: string | null
          reverses_event_id?: string | null
          reward_cost_cents_snapshot?: number | null
          reward_id?: string | null
          stamp_delta: number
          visit_reference?: string | null
        }
        Update: {
          actor_staff_id?: string
          card_id?: string
          event_type?: string
          id?: string
          occurred_at?: string
          operation_id?: string
          reason?: string | null
          recorded_at?: string
          reinstates_event_id?: string | null
          reverses_event_id?: string | null
          reward_cost_cents_snapshot?: number | null
          reward_id?: string | null
          stamp_delta?: number
          visit_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_events_actor_staff_id_fkey"
            columns: ["actor_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_events_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_events_reinstates_event_id_card_id_fkey"
            columns: ["reinstates_event_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_events"
            referencedColumns: ["id", "card_id"]
          },
          {
            foreignKeyName: "loyalty_events_reverses_event_id_card_id_fkey"
            columns: ["reverses_event_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_events"
            referencedColumns: ["id", "card_id"]
          },
          {
            foreignKeyName: "loyalty_events_reward_id_card_id_fkey"
            columns: ["reward_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id", "card_id"]
          },
        ]
      }
      loyalty_incidents: {
        Row: {
          card_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string
          id: string
          opened_by: string
          resolution_note: string | null
          revision: number
          reward_id: string | null
          source_event_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          card_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          id?: string
          opened_by: string
          resolution_note?: string | null
          revision?: number
          reward_id?: string | null
          source_event_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          id?: string
          opened_by?: string
          resolution_note?: string | null
          revision?: number
          reward_id?: string | null
          source_event_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_incidents_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_incidents_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_incidents_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_incidents_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_incidents_reward_id_card_id_fkey"
            columns: ["reward_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id", "card_id"]
          },
          {
            foreignKeyName: "loyalty_incidents_source_event_id_card_id_fkey"
            columns: ["source_event_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_events"
            referencedColumns: ["id", "card_id"]
          },
        ]
      }
      loyalty_program_versions: {
        Row: {
          code: string
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          revision: number
          reward_available: boolean
          reward_contents: string[]
          reward_cost_cents: number | null
          reward_name: string
          status: string
          target_stamps: number
          terms_version: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          revision?: number
          reward_available?: boolean
          reward_contents: string[]
          reward_cost_cents?: number | null
          reward_name: string
          status?: string
          target_stamps?: number
          terms_version: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          revision?: number
          reward_available?: boolean
          reward_contents?: string[]
          reward_cost_cents?: number | null
          reward_name?: string
          status?: string
          target_stamps?: number
          terms_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_program_versions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          card_id: string
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          issued_at: string
          issued_stamp_event_id: string
          ordinal: number
          program_version_id: string
          redeemed_at: string | null
          redeemed_by: string | null
          revision: number
          reward_contents_snapshot: string[]
          reward_name_snapshot: string
          status: string
          updated_at: string
        }
        Insert: {
          card_id: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          issued_at?: string
          issued_stamp_event_id: string
          ordinal: number
          program_version_id: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revision?: number
          reward_contents_snapshot: string[]
          reward_name_snapshot: string
          status?: string
          updated_at?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          issued_at?: string
          issued_stamp_event_id?: string
          ordinal?: number
          program_version_id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          revision?: number
          reward_contents_snapshot?: string[]
          reward_name_snapshot?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_issued_stamp_event_id_card_id_fkey"
            columns: ["issued_stamp_event_id", "card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_events"
            referencedColumns: ["id", "card_id"]
          },
          {
            foreignKeyName: "loyalty_rewards_program_version_id_fkey"
            columns: ["program_version_id"]
            isOneToOne: false
            referencedRelation: "loyalty_program_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_receipts: {
        Row: {
          actor_user_id: string
          created_at: string
          id: string
          operation_id: string
          operation_kind: string
          outcome: Json
          request_hash: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          id?: string
          operation_id: string
          operation_kind: string
          outcome: Json
          request_hash: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          id?: string
          operation_id?: string
          operation_kind?: string
          outcome?: Json
          request_hash?: string
        }
        Relationships: []
      }
      staff_accounts: {
        Row: {
          active: boolean
          auth_user_id: string
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          invitation_send_started_at: string | null
          invitation_status: string
          revision: number
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invitation_send_started_at?: string | null
          invitation_status?: string
          revision?: number
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          invitation_send_started_at?: string | null
          invitation_status?: string
          revision?: number
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_accounts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actor_user_id: { Args: never; Returns: string }
      card_key_customer: {
        Args: { p_key_hash: string }
        Returns: {
          access_key_expires_at: string | null
          access_key_hash: string | null
          auth_user_id: string | null
          contact_phone: string | null
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          display_name: string | null
          frequent_instructions: string
          id: string
          revision: number
          status: string
          terms_accepted_at: string
          terms_version: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      card_projection: {
        Args: { p_customer_id: string; p_staff?: boolean }
        Returns: Json
      }
      catalog_entity_table: { Args: { entity: string }; Returns: unknown }
      catalog_parent_live: {
        Args: { entity: string; value: Json }
        Returns: boolean
      }
      catalog_patch: {
        Args: { creating: boolean; entity: string; patch: Json }
        Returns: Json
      }
      change_loyalty_program: {
        Args: {
          p_available: boolean
          p_checks: Json
          p_cost: number
          p_kind: string
          p_operation: string
          p_program_id: string
          p_revision: number
          p_terms: string
        }
        Returns: Json
      }
      checkout_patch: { Args: { entity: string; input: Json }; Returns: Json }
      checkout_public: { Args: never; Returns: Json }
      commit_staff_operation: {
        Args: {
          actor: string
          changes: Json
          entity: string
          fingerprint: string
          justification?: string
          kind: string
          new_revision: number
          operation: string
          target: string
        }
        Returns: Json
      }
      config_projection: { Args: never; Returns: Json }
      confirmed_phone: { Args: { p_user_id: string }; Returns: string }
      confirmed_phone_user: { Args: { p_phone: string }; Returns: string }
      conserve_catalog: {
        Args: {
          entity: string
          expected: number
          operation: string
          reason: string
          restoring: boolean
          target: string
        }
        Returns: Json
      }
      conserve_existing_delete: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_revision: number
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      conserve_existing_restore: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_revision: number
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      conserve_loyalty: {
        Args: {
          p_entity: string
          p_id: string
          p_operation: string
          p_reason: string
          p_restoring: boolean
          p_revision: number
        }
        Returns: Json
      }
      conserve_staff: {
        Args: {
          entity_id: string
          entity_type: string
          expected_revision: number
          operation_id: string
          reason: string
          restoring: boolean
        }
        Returns: Json
      }
      credit_stamp_at: {
        Args: {
          p_customer_id: string
          p_delivered_confirmed: boolean
          p_kind: string
          p_occurred_at: string
          p_operation_id: string
          p_paid_confirmed: boolean
          p_reason: string
          p_visit_reference: string
        }
        Returns: Json
      }
      get_dashboard_before_reinstatement: {
        Args: { p_from: string; p_until: string }
        Returns: Json
      }
      get_h7_ordinary_operation: {
        Args: { p_operation_id: string }
        Returns: Json
      }
      get_history_before_reinstatement: {
        Args: { p_cursor?: string; p_customer_id: string; p_limit?: number }
        Returns: Json
      }
      get_management_operation: {
        Args: { p_operation_id: string }
        Returns: Json
      }
      invitation_auth_target: {
        Args: { p_email: string; p_invitation_id: string }
        Returns: Json
      }
      lock_catalog_entity: {
        Args: { entity: string; patch?: Json; target: string }
        Returns: Json
      }
      lock_loyalty_card: {
        Args: { p_customer_id: string; p_enabled_required?: boolean }
        Returns: {
          created_at: string
          customer_id: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          net_stamps: number
          program_version_id: string
          revision: number
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loyalty_cards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lock_phone_identity: { Args: { p_user_id: string }; Returns: string }
      loyalty_commit: {
        Args: {
          actor: string
          effect: Json
          entity: string
          fingerprint: string
          kind: string
          operation: string
          revision: number
          target: string
        }
        Returns: Json
      }
      loyalty_replay: {
        Args: { fingerprint: string; kind: string; operation: string }
        Returns: Json
      }
      loyalty_with_card: { Args: { result: Json }; Returns: Json }
      mutate_catalog: {
        Args: {
          creating?: boolean
          entity: string
          expected: number
          input: Json
          operation: string
          target: string
        }
        Returns: Json
      }
      normalize_config_patch: { Args: { patch: Json }; Returns: Json }
      normalize_config_patch_h5: { Args: { patch: Json }; Returns: Json }
      operation_hash: { Args: { payload: Json }; Returns: string }
      operation_replay: {
        Args: { fingerprint: string; kind: string; operation: string }
        Returns: Json
      }
      reinstate_reward_approved: {
        Args: {
          p_expected_revision: number
          p_incident_id: string
          p_not_delivered_confirmed: boolean
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      request_claims: { Args: never; Returns: Json }
      require_staff: {
        Args: { require_mfa?: boolean; required_role?: string }
        Returns: {
          active: boolean
          auth_user_id: string
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          invitation_send_started_at: string | null
          invitation_status: string
          revision: number
          role: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "staff_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      staff_auth_info: { Args: { p_user_id: string }; Returns: Json }
      update_business_config_base: {
        Args: {
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      valid_catalog_image: {
        Args: { item: string; path: string }
        Returns: boolean
      }
      valid_inclusions: { Args: { values_array: string[] }; Returns: boolean }
      valid_opening_periods: { Args: { periods: Json }; Returns: boolean }
      valid_weekdays: { Args: { days: number[] }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          address: string | null
          created_at: string
          display_name: string
          id: number
          location_verified: boolean
          loyalty_enabled: boolean
          maps_url: string | null
          opening_periods: Json
          ordering_enabled: boolean
          pickup_charges_verified: boolean
          pickup_extra_cents: number | null
          revision: number
          schedule_confirmed: boolean
          timezone: string
          updated_at: string
          whatsapp_e164: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name?: string
          id?: number
          location_verified?: boolean
          loyalty_enabled?: boolean
          maps_url?: string | null
          opening_periods?: Json
          ordering_enabled?: boolean
          pickup_charges_verified?: boolean
          pickup_extra_cents?: number | null
          revision?: number
          schedule_confirmed?: boolean
          timezone?: string
          updated_at?: string
          whatsapp_e164?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string
          id?: number
          location_verified?: boolean
          loyalty_enabled?: boolean
          maps_url?: string | null
          opening_periods?: Json
          ordering_enabled?: boolean
          pickup_charges_verified?: boolean
          pickup_extra_cents?: number | null
          revision?: number
          schedule_confirmed?: boolean
          timezone?: string
          updated_at?: string
          whatsapp_e164?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          availability: string
          category_id: string
          content_verified: boolean
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          image_path: string | null
          inclusions: string[]
          kind: string
          name: string
          online_enabled: boolean
          portion_label: string | null
          publication_status: string
          revision: number
          slug: string
          sort_order: number
          source_price_cents: number | null
          source_ref: string | null
          updated_at: string
        }
        Insert: {
          availability?: string
          category_id: string
          content_verified?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          inclusions?: string[]
          kind: string
          name: string
          online_enabled?: boolean
          portion_label?: string | null
          publication_status?: string
          revision?: number
          slug: string
          sort_order?: number
          source_price_cents?: number | null
          source_ref?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string
          category_id?: string
          content_verified?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_path?: string | null
          inclusions?: string[]
          kind?: string
          name?: string
          online_enabled?: boolean
          portion_label?: string | null
          publication_status?: string
          revision?: number
          slug?: string
          sort_order?: number
          source_price_cents?: number | null
          source_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_prices: {
        Row: {
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_id: string
          mode: string
          price_cents: number
          revision: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id: string
          mode: string
          price_cents: number
          revision?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id?: string
          mode?: string
          price_cents?: number
          revision?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "catalog_prices_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          name: string
          revision: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          name: string
          revision?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          name?: string
          revision?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          coverage: string
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          enabled: boolean
          fee_cents: number | null
          id: string
          minimum_subtotal_cents: number | null
          name: string
          revision: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          coverage: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          fee_cents?: number | null
          id?: string
          minimum_subtotal_cents?: number | null
          name: string
          revision?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          coverage?: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          fee_cents?: number | null
          id?: string
          minimum_subtotal_cents?: number | null
          name?: string
          revision?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      option_choices: {
        Row: {
          available: boolean
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          extra_price_cents: number
          group_id: string
          id: string
          label: string
          revision: number
          sort_order: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          available?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          extra_price_cents?: number
          group_id: string
          id?: string
          label: string
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          available?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          extra_price_cents?: number
          group_id?: string
          id?: string
          label?: string
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "option_choices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      option_groups: {
        Row: {
          active: boolean
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          item_id: string
          max_choices: number
          min_choices: number
          name: string
          revision: number
          sort_order: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id: string
          max_choices?: number
          min_choices?: number
          name: string
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          item_id?: string
          max_choices?: number
          min_choices?: number
          name?: string
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "option_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          enabled: boolean
          id: string
          instructions: string | null
          label: string
          needs_change: boolean
          revision: number
          sort_order: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          id?: string
          instructions?: string | null
          label: string
          needs_change?: boolean
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          id?: string
          instructions?: string | null
          label?: string
          needs_change?: boolean
          revision?: number
          sort_order?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      promotions: {
        Row: {
          comparison_verified: boolean
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          enabled: boolean
          ends_at: string | null
          item_id: string
          previous_price_cents: number | null
          revision: number
          starts_at: string | null
          updated_at: string
          weekdays: number[] | null
        }
        Insert: {
          comparison_verified?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          ends_at?: string | null
          item_id: string
          previous_price_cents?: number | null
          revision?: number
          starts_at?: string | null
          updated_at?: string
          weekdays?: number[] | null
        }
        Update: {
          comparison_verified?: boolean
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          enabled?: boolean
          ends_at?: string | null
          item_id?: string
          previous_price_cents?: number | null
          revision?: number
          starts_at?: string | null
          updated_at?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_loyalty_program: {
        Args: {
          p_checks?: Json
          p_cost_cents?: number
          p_expected_revision: number
          p_operation_id?: string
          p_program_id: string
          p_terms_version?: string
        }
        Returns: Json
      }
      before_customer_created: { Args: { event: Json }; Returns: Json }
      catalog_media_upload_allowed: {
        Args: { p_path: string }
        Returns: boolean
      }
      close_incident: {
        Args: {
          p_expected_revision: number
          p_incident_id: string
          p_operation_id: string
          p_resolution_note: string
        }
        Returns: Json
      }
      complete_staff_invitation: {
        Args: {
          p_email: string
          p_operation_id: string
          p_reservation_id: string
          p_role: string
        }
        Returns: Json
      }
      correct_customer_profile: {
        Args: {
          p_customer_id: string
          p_customer_request_confirmed: boolean
          p_display_name: string
          p_expected_revision: number
          p_frequent_instructions: string
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      create_catalog_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      credit_contingency_stamp: {
        Args: {
          p_customer_id: string
          p_delivered_confirmed: boolean
          p_occurred_at: string
          p_operation_id: string
          p_paid_confirmed: boolean
          p_reason: string
          p_visit_reference: string
        }
        Returns: Json
      }
      credit_stamp: {
        Args: {
          p_customer_id: string
          p_delivered_confirmed: boolean
          p_operation_id: string
          p_paid_confirmed: boolean
          p_visit_reference?: string
        }
        Returns: Json
      }
      ensure_card_by_key: {
        Args: {
          p_display_name: string
          p_key_hash: string
          p_phone: string
          p_terms_accepted: boolean
          p_terms_version: string
        }
        Returns: Json
      }
      ensure_customer_profile: {
        Args: {
          p_display_name: string
          p_terms_accepted: boolean
          p_terms_version: string
        }
        Returns: Json
      }
      get_admin_catalog: {
        Args: { p_include_deleted?: boolean }
        Returns: Json
      }
      get_admin_config: { Args: never; Returns: Json }
      get_admin_customers: {
        Args: { p_cursor?: string; p_filter?: string; p_limit?: number }
        Returns: Json
      }
      get_card_by_key: { Args: { p_key_hash: string }; Returns: Json }
      get_catalog_image_upload: {
        Args: { p_image_path: string }
        Returns: boolean
      }
      get_customer_history: {
        Args: { p_cursor?: string; p_customer_id: string; p_limit?: number }
        Returns: Json
      }
      get_loyalty_dashboard: {
        Args: { p_from: string; p_until: string }
        Returns: Json
      }
      get_loyalty_incidents: {
        Args: {
          p_cursor?: string
          p_include_deleted?: boolean
          p_limit?: number
          p_status?: string
        }
        Returns: Json
      }
      get_loyalty_offer: { Args: never; Returns: Json }
      get_loyalty_programs: { Args: never; Returns: Json }
      get_managed_staff: { Args: never; Returns: Json }
      get_my_card: { Args: never; Returns: Json }
      get_operation: { Args: { p_operation_id: string }; Returns: Json }
      get_staff_access: { Args: never; Returns: Json }
      get_staff_customer: { Args: { p_customer_id: string }; Returns: Json }
      get_staff_invitation_context: {
        Args: { p_email: string; p_operation_id: string; p_role: string }
        Returns: Json
      }
      has_staff_role: { Args: { required_role: string }; Returns: boolean }
      lookup_customer: { Args: { p_phone: string }; Returns: Json }
      open_incident: {
        Args: {
          p_customer_id: string
          p_description: string
          p_operation_id: string
          p_reward_id?: string
          p_source_event_id?: string
          p_type: string
        }
        Returns: Json
      }
      prepare_catalog_image_cleanup: {
        Args: { p_image_path: string; p_operation_id: string }
        Returns: Json
      }
      prepare_staff_invitation: {
        Args: { p_email: string; p_operation_id: string; p_role: string }
        Returns: Json
      }
      read_catalog: { Args: never; Returns: Json }
      recover_card_access: {
        Args: {
          p_customer_id: string
          p_expected_revision: number
          p_history_event_id: string
          p_identity_checked_confirmed: boolean
          p_in_person_confirmed: boolean
          p_new_key_hash: string
          p_operation_id: string
          p_reason: string
          p_reference: string
        }
        Returns: Json
      }
      redeem_reward: {
        Args: {
          p_customer_id: string
          p_later_visit_confirmed: boolean
          p_operation_id: string
          p_product_available_confirmed: boolean
          p_reward_id: string
        }
        Returns: Json
      }
      reinstate_reward: {
        Args: {
          p_expected_revision: number
          p_incident_id: string
          p_not_delivered_confirmed: boolean
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      restore_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_revision: number
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      reverse_stamp: {
        Args: {
          p_customer_id: string
          p_event_id: string
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      set_reward_availability: {
        Args: {
          p_available: boolean
          p_expected_revision: number
          p_operation_id: string
          p_program_id: string
        }
        Returns: Json
      }
      soft_delete_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_revision: number
          p_operation_id: string
          p_reason: string
        }
        Returns: Json
      }
      stage_staff_invitation: {
        Args: {
          p_email: string
          p_operation_id: string
          p_role: string
          p_user_id: string
        }
        Returns: Json
      }
      update_business_config: {
        Args: {
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_card_phone_by_key: {
        Args: {
          p_expected_revision: number
          p_key_hash: string
          p_phone: string
        }
        Returns: Json
      }
      update_card_profile_by_key: {
        Args: {
          p_display_name: string
          p_expected_revision: number
          p_frequent_instructions: string
          p_key_hash: string
        }
        Returns: Json
      }
      update_catalog_category: {
        Args: {
          p_entity_id: string
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_catalog_item: {
        Args: {
          p_expected_revision: number
          p_item_id: string
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_catalog_option_choice: {
        Args: {
          p_entity_id: string
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_catalog_option_group: {
        Args: {
          p_entity_id: string
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_catalog_price: {
        Args: {
          p_entity_id: string
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_catalog_promotion: {
        Args: {
          p_entity_id: string
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
        }
        Returns: Json
      }
      update_my_profile: {
        Args: {
          p_display_name: string
          p_expected_revision: number
          p_frequent_instructions: string
        }
        Returns: Json
      }
      update_reward_cost: {
        Args: {
          p_cost_cents?: number
          p_expected_revision: number
          p_operation_id?: string
          p_program_id: string
        }
        Returns: Json
      }
      update_staff_access: {
        Args: {
          p_expected_revision: number
          p_operation_id: string
          p_patch: Json
          p_staff_id: string
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  app_private: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
