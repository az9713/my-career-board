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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      problems: {
        Row: {
          id: string
          user_id: string
          name: string
          what_breaks: string
          scarcity_signals: string[]
          ai_cheaper: string | null
          error_cost: string | null
          trust_required: string | null
          classification: 'appreciating' | 'depreciating' | 'stable' | 'stable_uncertain'
          classification_reasoning: string | null
          time_allocation: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          what_breaks: string
          scarcity_signals: string[]
          ai_cheaper?: string | null
          error_cost?: string | null
          trust_required?: string | null
          classification: 'appreciating' | 'depreciating' | 'stable' | 'stable_uncertain'
          classification_reasoning?: string | null
          time_allocation?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          what_breaks?: string
          scarcity_signals?: string[]
          ai_cheaper?: string | null
          error_cost?: string | null
          trust_required?: string | null
          classification?: 'appreciating' | 'depreciating' | 'stable' | 'stable_uncertain'
          classification_reasoning?: string | null
          time_allocation?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      board_roles: {
        Row: {
          id: string
          user_id: string
          role_type: 'accountability' | 'market_reality' | 'avoidance' | 'strategist' | 'devils_advocate'
          anchored_problem_id: string | null
          focus_area: string
          system_prompt: string | null
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_type: 'accountability' | 'market_reality' | 'avoidance' | 'strategist' | 'devils_advocate'
          anchored_problem_id?: string | null
          focus_area: string
          system_prompt?: string | null
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_type?: 'accountability' | 'market_reality' | 'avoidance' | 'strategist' | 'devils_advocate'
          anchored_problem_id?: string | null
          focus_area?: string
          system_prompt?: string | null
          generated_at?: string
        }
      }
      board_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'quick_audit' | 'quarterly'
          quarter: string | null
          status: 'in_progress' | 'completed'
          current_phase: number
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_type: 'quick_audit' | 'quarterly'
          quarter?: string | null
          status?: 'in_progress' | 'completed'
          current_phase?: number
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'quick_audit' | 'quarterly'
          quarter?: string | null
          status?: 'in_progress' | 'completed'
          current_phase?: number
          started_at?: string
          completed_at?: string | null
        }
      }
      session_messages: {
        Row: {
          id: string
          session_id: string
          speaker: string
          content: string
          message_type: 'question' | 'response' | 'challenge' | 'interjection' | 'system'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          speaker: string
          content: string
          message_type: 'question' | 'response' | 'challenge' | 'interjection' | 'system'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          speaker?: string
          content?: string
          message_type?: 'question' | 'response' | 'challenge' | 'interjection' | 'system'
          metadata?: Json | null
          created_at?: string
        }
      }
      quarterly_reports: {
        Row: {
          id: string
          session_id: string
          user_id: string
          quarter: string
          last_bet: string | null
          last_bet_wrong_if: string | null
          last_bet_result: 'happened' | 'didnt' | 'partial' | null
          last_bet_evidence: string | null
          commitments: Json | null
          avoided_decision: string
          avoided_decision_why: string
          avoided_decision_cost: string
          comfort_work: string
          comfort_work_avoided: string
          next_bet: string
          next_bet_wrong_if: string
          overall_assessment: string | null
          concerns: string[] | null
          action_items: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          quarter: string
          last_bet?: string | null
          last_bet_wrong_if?: string | null
          last_bet_result?: 'happened' | 'didnt' | 'partial' | null
          last_bet_evidence?: string | null
          commitments?: Json | null
          avoided_decision: string
          avoided_decision_why: string
          avoided_decision_cost: string
          comfort_work: string
          comfort_work_avoided: string
          next_bet: string
          next_bet_wrong_if: string
          overall_assessment?: string | null
          concerns?: string[] | null
          action_items?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          quarter?: string
          last_bet?: string | null
          last_bet_wrong_if?: string | null
          last_bet_result?: 'happened' | 'didnt' | 'partial' | null
          last_bet_evidence?: string | null
          commitments?: Json | null
          avoided_decision?: string
          avoided_decision_why?: string
          avoided_decision_cost?: string
          comfort_work?: string
          comfort_work_avoided?: string
          next_bet?: string
          next_bet_wrong_if?: string
          overall_assessment?: string | null
          concerns?: string[] | null
          action_items?: string[] | null
          created_at?: string
        }
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
  }
}
