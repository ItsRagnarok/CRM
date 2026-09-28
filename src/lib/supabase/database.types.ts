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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items: {
        Row: {
          id: string
          is_required: boolean
          label: string
          phase: string
          sort_order: number
          template_id: string
        }
        Insert: {
          id?: string
          is_required?: boolean
          label: string
          phase: string
          sort_order?: number
          template_id: string
        }
        Update: {
          id?: string
          is_required?: boolean
          label?: string
          phase?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          job_type: Database["public"]["Enums"]["job_type"] | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          job_type?: Database["public"]["Enums"]["job_type"] | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          job_type?: Database["public"]["Enums"]["job_type"] | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          created_at: string
          created_by: string | null
          cui: string | null
          email: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          cui?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          cui?: string | null
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          doc_type: string | null
          id: string
          job_id: string | null
          name: string
          organization_id: string
          profile_id: string | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          doc_type?: string | null
          id?: string
          job_id?: string | null
          name: string
          organization_id: string
          profile_id?: string | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          doc_type?: string | null
          id?: string
          job_id?: string | null
          name?: string
          organization_id?: string
          profile_id?: string | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_receipts: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          ocr_data: Json | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          ocr_data?: Json | null
          storage_path: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          ocr_data?: Json | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          currency: string
          expense_date: string
          id: string
          job_id: string
          notes: string | null
          organization_id: string
          rejection_reason: string | null
          status: string
          submitted_by: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          currency?: string
          expense_date?: string
          id?: string
          job_id: string
          notes?: string | null
          organization_id: string
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          currency?: string
          expense_date?: string
          id?: string
          job_id?: string
          notes?: string | null
          organization_id?: string
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string
          job_id: string | null
          labor_amount: number
          materials_amount: number
          organization_id: string
          other_amount: number
          status: string
          total_amount: number | null
          travel_amount: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          job_id?: string | null
          labor_amount?: number
          materials_amount?: number
          organization_id: string
          other_amount?: number
          status?: string
          total_amount?: number | null
          travel_amount?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          job_id?: string | null
          labor_amount?: number
          materials_amount?: number
          organization_id?: string
          other_amount?: number
          status?: string
          total_amount?: number | null
          travel_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assigned_at: string
          assigned_role: string | null
          job_id: string
          profile_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_role?: string | null
          job_id: string
          profile_id: string
        }
        Update: {
          assigned_at?: string
          assigned_role?: string | null
          job_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklist_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          id: string
          is_checked: boolean
          job_checklist_id: string
          label: string
          sort_order: number
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          is_checked?: boolean
          job_checklist_id: string
          label: string
          sort_order?: number
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          id?: string
          is_checked?: boolean
          job_checklist_id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_checklist_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklist_items_job_checklist_id_fkey"
            columns: ["job_checklist_id"]
            isOneToOne: false
            referencedRelation: "job_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      job_checklists: {
        Row: {
          created_at: string
          id: string
          job_id: string
          phase: string
          template_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          phase: string
          template_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          phase?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_checklists_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          job_id: string
          lat: number | null
          lng: number | null
          note: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          job_id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          arrived_at: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          display_number: number
          distance_km: number | null
          end_time: string | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location_id: string | null
          observations: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["job_priority"]
          scheduled_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"]
          team_id: string | null
          title: string
          updated_at: string
          work_ended_at: string | null
          work_started_at: string | null
        }
        Insert: {
          arrived_at?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_number?: number
          distance_km?: number | null
          end_time?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          location_id?: string | null
          observations?: string | null
          organization_id: string
          priority?: Database["public"]["Enums"]["job_priority"]
          scheduled_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          team_id?: string | null
          title: string
          updated_at?: string
          work_ended_at?: string | null
          work_started_at?: string | null
        }
        Update: {
          arrived_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_number?: number
          distance_km?: number | null
          end_time?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          location_id?: string | null
          observations?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["job_priority"]
          scheduled_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
          work_ended_at?: string | null
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          client_id: string
          created_at: string
          id: string
          label: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          organization_id: string
        }
        Insert: {
          address: string
          client_id: string
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          organization_id: string
        }
        Update: {
          address?: string
          client_id?: string
          created_at?: string
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_stock: {
        Row: {
          id: string
          material_id: string
          organization_id: string
          quantity: number
          updated_at: string
          vehicle_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          id?: string
          material_id: string
          organization_id: string
          quantity?: number
          updated_at?: string
          vehicle_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          organization_id?: string
          quantity?: number
          updated_at?: string
          vehicle_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_stock_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      material_usage: {
        Row: {
          id: string
          is_shortage: boolean
          job_id: string
          material_id: string
          organization_id: string
          quantity: number
          source_vehicle_id: string | null
          source_warehouse_id: string | null
          used_at: string
          used_by: string | null
        }
        Insert: {
          id?: string
          is_shortage?: boolean
          job_id: string
          material_id: string
          organization_id: string
          quantity: number
          source_vehicle_id?: string | null
          source_warehouse_id?: string | null
          used_at?: string
          used_by?: string | null
        }
        Update: {
          id?: string
          is_shortage?: boolean
          job_id?: string
          material_id?: string
          organization_id?: string
          quantity?: number
          source_vehicle_id?: string | null
          source_warehouse_id?: string | null
          used_at?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_usage_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_source_vehicle_id_fkey"
            columns: ["source_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_usage_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string | null
          created_at: string
          id: string
          min_stock: number
          name: string
          organization_id: string
          unit: string
          unit_cost: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          organization_id: string
          unit?: string
          unit_cost?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          organization_id?: string
          unit?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          organization_id: string
          profile_id: string
          related_job_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id: string
          profile_id: string
          related_job_id?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          organization_id?: string
          profile_id?: string
          related_job_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          cui: string | null
          email: string | null
          gps_continuous_tracking_enabled: boolean
          gps_retention_days: number
          id: string
          is_active: boolean
          logo_storage_path: string | null
          name: string
          phone: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          cui?: string | null
          email?: string | null
          gps_continuous_tracking_enabled?: boolean
          gps_retention_days?: number
          id?: string
          is_active?: boolean
          logo_storage_path?: string | null
          name: string
          phone?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          cui?: string | null
          email?: string | null
          gps_continuous_tracking_enabled?: boolean
          gps_retention_days?: number
          id?: string
          is_active?: boolean
          logo_storage_path?: string | null
          name?: string
          phone?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          category: string
          created_at: string
          id: string
          job_id: string
          organization_id: string
          storage_path: string
          taken_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          job_id: string
          organization_id: string
          storage_path: string
          taken_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          job_id?: string
          organization_id?: string
          storage_path?: string
          taken_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          job_id: string
          organization_id: string
          pdf_storage_path: string | null
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          job_id: string
          organization_id: string
          pdf_storage_path?: string | null
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          job_id?: string
          organization_id?: string
          pdf_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          id: string
          job_id: string
          organization_id: string
          signed_at: string
          signer_name: string
          signer_role: string
          storage_path: string
        }
        Insert: {
          id?: string
          job_id: string
          organization_id: string
          signed_at?: string
          signer_name: string
          signer_role?: string
          storage_path: string
        }
        Update: {
          id?: string
          job_id?: string
          organization_id?: string
          signed_at?: string
          signer_name?: string
          signer_role?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          ai_credits: number
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          max_jobs_per_month: number
          max_users: number
          organization_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          storage_limit_gb: number
        }
        Insert: {
          ai_credits?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          max_jobs_per_month?: number
          max_users?: number
          organization_id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          storage_limit_gb?: number
        }
        Update: {
          ai_credits?: number
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          max_jobs_per_month?: number
          max_users?: number
          organization_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          storage_limit_gb?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_at: string
          profile_id: string
          team_id: string
        }
        Insert: {
          added_at?: string
          profile_id: string
          team_id: string
        }
        Update: {
          added_at?: string
          profile_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          team_leader_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          team_leader_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          team_leader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          event_type: string
          id: string
          job_id: string
          lat: number | null
          lng: number | null
          occurred_at: string
          organization_id: string
          profile_id: string
        }
        Insert: {
          event_type: string
          id?: string
          job_id: string
          lat?: number | null
          lng?: number | null
          occurred_at?: string
          organization_id: string
          profile_id: string
        }
        Update: {
          event_type?: string
          id?: string
          job_id?: string
          lat?: number | null
          lng?: number | null
          occurred_at?: string
          organization_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_team_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          plate_number: string | null
        }
        Insert: {
          assigned_team_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          plate_number?: string | null
        }
        Update: {
          assigned_team_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          plate_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string
          id: string
          is_central: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_central?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_central?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_and_owner: {
        Args: { org_name: string; owner_full_name: string }
        Returns: string
      }
      current_client_id: { Args: never; Returns: string }
      current_org_id: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      is_staff: { Args: never; Returns: boolean }
      platform_admin_create_company: {
        Args: {
          company_cui: string
          company_name: string
          owner_email: string
          owner_full_name: string
          owner_password: string
        }
        Returns: string
      }
      platform_admin_list_companies: {
        Args: never
        Returns: {
          address: string
          created_at: string
          cui: string
          email: string
          id: string
          is_active: boolean
          job_count: number
          name: string
          phone: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          user_count: number
        }[]
      }
      platform_admin_list_company_users: {
        Args: { org_id: string }
        Returns: {
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      platform_admin_update_company: {
        Args: {
          company_address: string
          company_cui: string
          company_email: string
          company_name: string
          company_phone: string
          new_is_active: boolean
          new_plan: Database["public"]["Enums"]["subscription_plan"]
          org_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      client_status: "active" | "inactive"
      client_type: "company" | "individual"
      job_priority: "normala" | "ridicata" | "urgenta"
      job_status:
        | "programata"
        | "in_drum"
        | "ajunsa"
        | "in_lucru"
        | "pauza"
        | "finalizata"
        | "necesita_atentie"
        | "anulata"
      job_type:
        | "instalare"
        | "reparatie"
        | "mentenanta"
        | "inspectie"
        | "interventie"
        | "service"
        | "demontare"
        | "urgenta"
      subscription_plan: "starter" | "team" | "pro" | "enterprise"
      user_role: "admin" | "manager" | "team_leader" | "technician" | "client"
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
  public: {
    Enums: {
      client_status: ["active", "inactive"],
      client_type: ["company", "individual"],
      job_priority: ["normala", "ridicata", "urgenta"],
      job_status: [
        "programata",
        "in_drum",
        "ajunsa",
        "in_lucru",
        "pauza",
        "finalizata",
        "necesita_atentie",
        "anulata",
      ],
      job_type: [
        "instalare",
        "reparatie",
        "mentenanta",
        "inspectie",
        "interventie",
        "service",
        "demontare",
        "urgenta",
      ],
      subscription_plan: ["starter", "team", "pro", "enterprise"],
      user_role: ["admin", "manager", "team_leader", "technician", "client"],
    },
  },
} as const
