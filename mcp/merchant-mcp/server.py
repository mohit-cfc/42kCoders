import json
import math
import os
from typing import Optional
from mcp.server.fastmcp import FastMCP
from contracts.models import MerchantSearchResponse, Merchant, Deal

# Initialize FastMCP Server
mcp = FastMCP("merchant-mcp")

# Load mock database
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_path, "data.json")

with open(data_path, "r") as f:
    merchants_data = json.load(f)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Earth radius in meters
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@mcp.tool()
def search_merchants(
    latitude: float,
    longitude: float,
    category: Optional[str] = None,
    radius_meters: float = 2000.0,
    query: Optional[str] = None
) -> str:
    """
    Search for merchants and nearby shop deals based on GPS location.
    
    Args:
        latitude: GPS latitude of the user
        longitude: GPS longitude of the user
        category: Optional category filter (e.g. food, grocery, electronics, pharmacy, clothing)
        radius_meters: Optional search radius in meters (default is 2000m)
        query: Optional text search query (e.g. 'Sharmaji', 'Bikaner')
    """
    matched = []
    for item in merchants_data:
        distance = haversine_distance(latitude, longitude, item["latitude"], item["longitude"])
        if distance <= radius_meters:
            # Check category
            if category and item["category"].lower() != category.lower():
                continue
            # Check text query
            if query and query.lower() not in item["name"].lower() and query.lower() not in item["address"].lower():
                continue
            
            # Update distance dynamically
            item_copy = dict(item)
            item_copy["distance_meters"] = round(distance, 1)
            matched.append(item_copy)
            
    # Sort by proximity
    matched.sort(key=lambda x: x["distance_meters"])
    
    response = MerchantSearchResponse(
        merchants=[Merchant(**m) for m in matched],
        total_found=len(matched)
    )
    return response.model_dump_json()

@mcp.tool()
def get_merchant_deals(merchant_id: str) -> str:
    """
    Get active cashback offers and payment deals for a specific merchant.
    
    Args:
        merchant_id: Unique merchant identifier
    """
    for item in merchants_data:
        if item["id"] == merchant_id:
            deals = [Deal(**d) for d in item.get("deals", [])]
            return json.dumps([d.model_dump() for d in deals])
    return json.dumps({"error": f"Merchant {merchant_id} not found."})

if __name__ == "__main__":
    mcp.run()
