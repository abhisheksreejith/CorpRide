import React from "react";

export type Coordinate = { latitude: number; longitude: number };

type TripTrackingState = {
  path: Coordinate[];
  currentIndex: number;
  currentCoord: Coordinate;
  etaMinutes: number;
  isRunning: boolean;
};

// Simple linear interpolation between two coordinates
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useTripTracking(params?: {
  origin?: Coordinate;
  destination?: Coordinate;
  speedMps?: number;
}) {
  const {
    origin = { latitude: 12.9716, longitude: 77.5946 },
    destination = { latitude: 12.9352, longitude: 77.6245 },
    speedMps = 10,
  } = params || {};
  const [state, setState] = React.useState<TripTrackingState>(() => {
    const path: Coordinate[] = [
      origin,
      {
        latitude: lerp(origin.latitude, destination.latitude, 0.33),
        longitude: lerp(origin.longitude, destination.longitude, 0.33),
      },
      {
        latitude: lerp(origin.latitude, destination.latitude, 0.66),
        longitude: lerp(origin.longitude, destination.longitude, 0.66),
      },
      destination,
    ];
    return {
      path,
      currentIndex: 0,
      currentCoord: origin,
      etaMinutes: 15,
      isRunning: true,
    };
  });

  React.useEffect(() => {
    if (!state.isRunning) return;
    const timer = setInterval(() => {
      setState((prev) => {
        const nextIndex = Math.min(prev.currentIndex + 1, prev.path.length - 1);
        const remaining = prev.path.length - 1 - nextIndex;
        const etaMinutes = Math.max(0, remaining * 5); // rough estimate
        return {
          ...prev,
          currentIndex: nextIndex,
          currentCoord: prev.path[nextIndex] ?? prev.currentCoord,
          etaMinutes,
          isRunning: nextIndex < prev.path.length - 1,
        };
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [state.isRunning]);

  const reset = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: 0,
      currentCoord: prev.path[0] ?? prev.currentCoord,
      etaMinutes: 15,
      isRunning: true,
    }));
  }, []);

  return { state, reset };
}
