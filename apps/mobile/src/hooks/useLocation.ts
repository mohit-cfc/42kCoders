import { useCallback, useEffect, useState } from "react";

// TODO (frontend owner): wire @react-native-community/geolocation +
// PermissionsAndroid (ACCESS_FINE_LOCATION) here. Returns the device GPS coords.
// Do not hardcode coordinates (see CLAUDE.md).

export interface Coords {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    // Geolocation.getCurrentPosition(...) -> setCoords({ lat, lng })
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, loading, error, refresh };
}
