import json
import os
from typing import Optional
from mcp.server.fastmcp import FastMCP
from contracts.models import SupportSearchResponse, SupportItem

# Initialize FastMCP Server
mcp = FastMCP("support-mcp")

# Load mock database
base_path = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(base_path, "support_data.json")

with open(data_path, "r") as f:
    support_data = json.load(f)

@mcp.tool()
def search_support(query: str, category: Optional[str] = None) -> str:
    """
    Search for Paytm help topics, FAQs, and system actions.
    
    Args:
        query: Search keywords (e.g. 'kyc', 'wallet limit', 'refund', 'failed upi')
        category: Optional category filter (e.g. wallet, travel, upi, profile)
    """
    matched = []
    keywords = query.lower().split()
    
    for item in support_data:
        # Check category filter
        if category and item["category"].lower() != category.lower():
            continue
            
        # Match keywords in question, answer, or tags
        matches = 0
        searchable_text = f"{item['question']} {item['answer']} {' '.join(item.get('tags', []))}".lower()
        
        for word in keywords:
            if word in searchable_text:
                matches += 1
                
        if matches > 0:
            matched.append((item, matches))
            
    # Sort by number of keyword matches desc
    matched.sort(key=lambda x: x[1], reverse=True)
    
    # Extract original dict
    results = [x[0] for x in matched]
    
    # Optional simple synthesis for quick answer
    synthesis = None
    if results:
        top_item = results[0]
        synthesis = f"Based on your query, here is the solution for '{top_item['question']}': {top_item['answer']}"
        if top_item.get("action_link"):
            synthesis += f" You can resolve this immediately using this link: {top_item['action_link']}"
            
    response = SupportSearchResponse(
        items=[SupportItem(**s) for s in results],
        answer_synthesis=synthesis
    )
    return response.model_dump_json()

if __name__ == "__main__":
    mcp.run()
