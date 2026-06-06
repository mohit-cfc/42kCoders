import { useCallback, useState } from "react";

import { DEMO_CENTER } from "../constants";

// TODO (frontend owner): wire @react-native-community/geolocation +
// PermissionsAndroid (ACCESS_FINE_LOCATION) here. Returns the device GPS coords.
// For the UI demo we seed with DEMO_CENTER so MapScreen has something to
// render without a permissions prompt — replace this with the real
// Geolocation.getCurrentPosition call before shipping.

export interface Coords {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(DEMO_CENTER);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    // Geolocation.getCurrentPosition(...) -> setCoords({ lat, lng })
    setCoords(DEMO_CENTER);
    setLoading(false);
  }, []);

  return { coords, loading, error, refresh };
}
