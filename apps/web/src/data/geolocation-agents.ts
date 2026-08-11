export interface GeolocationAgent {
  id: string;
  name: string;
  site: string;
  zone?: string;
  status: "En poste" | "En déplacement" | "Hors ligne";
  lastUpdate: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  direction: number; // degrees (0 = North, 90 = East, 180 = South, 270 = West)
  battery: number; // percentage
  shiftStart: string; // HH:mm
  shiftEnd: string; // HH:mm
}

export const mockGeolocationAgents: GeolocationAgent[] = [];
