import json
import os
from typing import Optional
from mcp.server.fastmcp import FastMCP
from contracts.models import TravelSearchResponse, TravelOption

# Initialize FastMCP Server
mcp = FastMCP("travel-mcp")

# Load mock database
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_path, "data.json")

with open(data_path, "r") as f:
    travel_data = json.load(f)

@mcp.tool()
def search_travel_options(
    type: str,
    destination: str,
    departure_date: str,
    origin: Optional[str] = None,
    return_date: Optional[str] = None,
    passengers: int = 1
) -> str:
    """
    Search for travel options including flights, trains, and hotels.
    
    Args:
        type: Type of travel ("flight", "train", or "hotel")
        destination: Target destination city/location
        departure_date: Date of departure or check-in (YYYY-MM-DD)
        origin: Origin city (required for flights and trains)
        return_date: Optional return date or check-out (YYYY-MM-DD)
        passengers: Number of travelers (default is 1)
    """
    matched = []
    
    # Clean input
    travel_type = type.lower().strip()
    dest = destination.lower().strip()
    orig = origin.lower().strip() if origin else ""
    
    for item in travel_data:
        # Check type
        if item["type"].lower() != travel_type:
            continue
            
        # Check destination
        if dest not in item["destination"].lower():
            continue
            
        # Check origin for routes (flights and trains)
        if travel_type in ["flight", "train"] and orig:
            if orig not in item["origin"].lower():
                continue
                
        # In a real system, we would check dates, but for this mock,
        # we return matching options and format details.
        item_copy = dict(item)
        
        # Calculate price based on passengers
        if travel_type != "hotel":
            item_copy["price"] = round(item["price"] * passengers, 2)
            item_copy["details"] = f"{item['details']} | Booking for {passengers} passenger(s)."
        else:
            nights = 1
            if return_date and departure_date:
                try:
                    from datetime import datetime
                    d1 = datetime.strptime(departure_date, "%Y-%m-%d")
                    d2 = datetime.strptime(return_date, "%Y-%m-%d")
                    nights = max((d2 - d1).days, 1)
                except Exception:
                    pass
            item_copy["price"] = round(item["price"] * nights * passengers, 2)
            item_copy["details"] = f"{item['details']} | Booking for {passengers} room(s) for {nights} night(s)."
            
        matched.append(item_copy)
        
    response = TravelSearchResponse(
        options=[TravelOption(**o) for o in matched],
        total_found=len(matched)
    )
    return response.model_dump_json()

if __name__ == "__main__":
    mcp.run()
