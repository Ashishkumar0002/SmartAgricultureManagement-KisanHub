export interface Advisory {
  id: number;
  question: string;
  response?: string;
  farmer_id?: number;
  expert_id?: number;
  created_at?: string;
}

export interface AdvisoryMessage {
  id: number;
  advisory_id: number;
  message: string;
  sender_id: number;
  is_from_expert: boolean;
  created_at?: string;
}

export interface AdvisoryPayload {
  question: string;
  farmer_id?: number;
}

export interface AdvisoryResponsePayload {
  response: string;
}
