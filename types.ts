export interface Parcel {
  id: string;
  trackingNumber: string;
  recipient: string;
  origin: string;
  destination: string;
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Out for Delivery' | 'Pending';
  estimatedDelivery: string;
  currentLocation: string;
  history: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

export interface AIAnalysis {
  prediction: string;
  reasoning: string;
  delayProbability: number; // 0-100
  weatherImpact: string;
  recommendedAction: string;
}

export interface LiveConditions {
  trafficStatus: string;
  weatherStatus: string;
  alerts: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GroundingData {
  searchSources?: GroundingSource[];
  mapSources?: GroundingSource[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success';
  time: string;
}

export interface VideoState {
  isLoading: boolean;
  videoUrl: string | null;
  error: string | null;
}