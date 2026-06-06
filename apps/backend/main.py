import asyncio
import base64
import json
import os
import re
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# Import shared Pydantic models
from contracts.models import (
    MerchantSearchResponse,
    TravelSearchResponse,
    SupportSearchResponse
)
from contracts.api import ChatRequest, ChatResponse, ChatMessage
from mcp_client import MCPOrchestrator

load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_BASE_URL = "https://api.sarvam.ai"

# Global orchestrator instance
orchestrator = MCPOrchestrator()

# In-memory session store for conversation history
# session_id -> list of ChatMessage dicts
session_memory: Dict[str, List[Dict[str, str]]] = {}

# Lifespan context manager for startup/shutdown
async def lifespan(app: FastAPI):
    # Startup: boot up the 3 MCP servers
    await orchestrator.start()
    yield
    # Shutdown: clean up MCP subprocesses
    await orchestrator.stop()

app = FastAPI(
    title="Paytm Hackathon FastAPI Orchestrator",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper functions for Sarvam AI ---

async def transcribe_audio(audio_file_bytes: bytes, filename: str) -> str:
    """Send audio bytes to Sarvam AI Speech-to-Text."""
    if not SARVAM_API_KEY:
        print("SARVAM_API_KEY not found. Simulating STT transcription.")
        # Fallback simulated queries based on filename keywords or defaults
        query = "find nearby grocery stores with discount offers"
        if "travel" in filename.lower() or "flight" in filename.lower():
            query = "search flights from Delhi to Mumbai for June 10"
        elif "kyc" in filename.lower() or "wallet" in filename.lower():
            query = "how do I complete my paytm wallet kyc"
        return query

    headers = {"api-subscription-key": SARVAM_API_KEY}
    files = {"file": (filename, audio_file_bytes, "audio/wav")}
    data = {"model": "saaras_v3", "language_code": "en-IN"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SARVAM_BASE_URL}/speech-to-text",
                headers=headers,
                files=files,
                data=data,
                timeout=15.0
            )
            if response.status_code == 200:
                result = response.json()
                return result.get("transcript", "")
            else:
                print(f"Sarvam STT returned status code {response.status_code}: {response.text}")
                return "find nearby grocery stores"
        except Exception as e:
            print(f"Error calling Sarvam STT: {e}")
            return "find nearby grocery stores"


async def synthesize_speech(text: str) -> Optional[str]:
    """Convert text response to speech using Sarvam AI Text-to-Speech."""
    if not SARVAM_API_KEY:
        print("SARVAM_API_KEY not found. Skipping TTS generation.")
        return None

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": [text],
        "model": "bulbul:v3",
        "voice": "swara",
        "language_code": "en-IN",
        "audio_format": "wav"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SARVAM_BASE_URL}/text-to-speech",
                headers=headers,
                json=payload,
                timeout=15.0
            )
            if response.status_code == 200:
                result = response.json()
                # Sarvam TTS usually returns a dict with "audios" containing base64 string
                audios = result.get("audios", [])
                if audios:
                    return audios[0]
            else:
                print(f"Sarvam TTS returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error calling Sarvam TTS: {e}")
    return None


async def classify_intent(query: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
    """Classify user intent using Sarvam Chat Completion or local fallback."""
    system_prompt = (
        "You are a Paytm Voice Assistant orchestrator. Classify the user query into one of: "
        "'merchant', 'travel', 'support', 'general'. Respond ONLY with a valid JSON containing "
        "'intent' (string) and 'arguments' (dict of parameters). No markdown, no wrappers.\n\n"
        "merchant args: {'query': optional string, 'category': optional string}\n"
        "travel args: {'type': 'flight'|'train'|'hotel', 'origin': optional string, 'destination': string, 'departure_date': 'YYYY-MM-DD', 'passengers': int}\n"
        "support args: {'query': string}\n"
        "general args: {}\n\n"
        "Example output: {\"intent\": \"travel\", \"arguments\": {\"type\": \"flight\", \"origin\": \"Delhi\", \"destination\": \"Mumbai\", \"departure_date\": \"2026-06-10\"}}"
    )

    if not SARVAM_API_KEY:
        # Local Rule-based Fallback Classifier (highly reliable for mock testing!)
        query_lower = query.lower()
        if any(w in query_lower for w in ["flight", "train", "hotel", "travel", "ticket", "book"]):
            # Extract destination/origin
            dest = "Mumbai"
            if "mumbai" in query_lower:
                dest = "Mumbai"
            elif "bhopal" in query_lower:
                dest = "Bhopal"
            elif "noida" in query_lower:
                dest = "Noida"
                
            orig = "Delhi"
            if "from bhopal" in query_lower:
                orig = "Bhopal"
            elif "from mumbai" in query_lower:
                orig = "Mumbai"
                
            travel_type = "flight"
            if "train" in query_lower:
                travel_type = "train"
            elif "hotel" in query_lower:
                travel_type = "hotel"
                
            return {
                "intent": "travel",
                "arguments": {
                    "type": travel_type,
                    "origin": orig if travel_type != "hotel" else None,
                    "destination": dest,
                    "departure_date": "2026-06-10",
                    "passengers": 1
                }
            }
        elif any(w in query_lower for w in ["kyc", "wallet limit", "limit", "refund", "failed", "cancel", "settings"]):
            return {
                "intent": "support",
                "arguments": {
                    "query": query
                }
            }
        elif any(w in query_lower for w in ["merchant", "deal", "discount", "offer", "shop", "restaurant", "store", "sharmaji", "bikaner", "apollo"]):
            # Extract category
            category = None
            for cat in ["grocery", "food", "electronics", "pharmacy", "clothing"]:
                if cat in query_lower:
                    category = cat
            return {
                "intent": "merchant",
                "arguments": {
                    "query": query if category is None else None,
                    "category": category,
                    "radius_meters": 2000.0
                }
            }
        else:
            return {
                "intent": "general",
                "arguments": {}
            }

    # API Call to Sarvam AI Chat completions
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    messages = [
        {"role": "system", "content": system_prompt},
        *history[-4:], # Include recent history
        {"role": "user", "content": query}
    ]
    payload = {
        "model": "sarvam-m", # Or standard supported Sarvam LLM model ID
        "messages": messages,
        "temperature": 0.0
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SARVAM_BASE_URL}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=10.0
            )
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"].strip()
                # Clean clean json wrapping
                content_clean = re.sub(r"```json|```", "", content).strip()
                return json.loads(content_clean)
        except Exception as e:
            print(f"Error during intent classification: {e}")
            
    # Ultimate fallback
    return {"intent": "general", "arguments": {}}


async def generate_conversational_response(
    query: str,
    intent: str,
    tool_output: str,
    history: List[Dict[str, str]]
) -> str:
    """Generate final response based on query and tool results."""
    system_prompt = (
        "You are the Paytm Voice Assistant. Synthesize a warm, conversational, friendly "
        "response summarizing the results of the tool. Keep it concise (max 3 sentences) and "
        "suitable for speech. Do not use markdown format. Highlight prices, deals, or support links."
    )
    
    user_prompt = (
        f"User Query: {query}\n"
        f"Intent: {intent}\n"
        f"Search Results: {tool_output}"
    )

    if not SARVAM_API_KEY:
        # Mock Response synthesis
        if intent == "merchant":
            try:
                data = json.loads(tool_output)
                merchants = data.get("merchants", [])
                if not merchants:
                    return "I couldn't find any nearby merchants with active deals in your area."
                top = merchants[0]
                deal_text = f" offering {top['deals'][0]['title']}" if top.get("deals") else ""
                return f"I found {len(merchants)} merchants near you. The closest is {top['name']} at {top['distance_meters']} meters,{deal_text}."
            except Exception:
                return "I found some great nearby shops and active payment deals for you."
                
        elif intent == "travel":
            try:
                data = json.loads(tool_output)
                options = data.get("options", [])
                if not options:
                    return "I couldn't find any matching flights, trains, or hotels for your request."
                top = options[0]
                return f"I found {len(options)} options. The recommended choice is {top['provider']} {top['name']} for ₹{top['price']}, which is a {top['type']}."
            except Exception:
                return "I found some flight and train travel options matching your search details."
                
        elif intent == "support":
            try:
                data = json.loads(tool_output)
                synthesis = data.get("answer_synthesis")
                if synthesis:
                    return synthesis
                items = data.get("items", [])
                if items:
                    return f"Here is what I found: {items[0]['answer']}"
                return "I couldn't find an exact match for your support query. You can go to settings or UPI help."
            except Exception:
                return "I found some help articles regarding your Paytm wallet account setup."
                
        else:
            return "I can help you search nearby merchant deals, find flights or trains, or help you with your Paytm wallet KYC."

    # Call Sarvam AI LLM
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    messages = [
        {"role": "system", "content": system_prompt},
        *history[-4:],
        {"role": "user", "content": user_prompt}
    ]
    payload = {
        "model": "sarvam-m",
        "messages": messages,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SARVAM_BASE_URL}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"Error during response generation: {e}")
            
    return "I processed your request, but was unable to reach the generator. Please check your options."

# --- API Endpoints ---

@app.get("/api/health")
async def health_check():
    """Health check endpoint confirming active MCP servers."""
    status = {name: (sess is not None) for name, sess in orchestrator.sessions.items()}
    return {
        "status": "healthy",
        "mcp_servers": status
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Unified API for text search and orchestrations."""
    session_id = request.session_id
    query = request.query
    lat = request.latitude or 28.5355  # Noida default
    lng = request.longitude or 77.3910 # Noida default
    
    # Initialize history if missing
    if session_id not in session_memory:
        session_memory[session_id] = []
    
    history_dict = [{"role": msg.role, "content": msg.content} for msg in request.history]
    
    # 1. Intent Classification
    intent_data = await classify_intent(query, history_dict)
    intent = intent_data.get("intent", "general")
    args = intent_data.get("arguments", {})
    
    # 2. Tool Routing and Execution
    tool_output = ""
    structured_data = None
    
    try:
        if intent == "merchant":
            # Pass location coords
            args["latitude"] = lat
            args["longitude"] = lng
            tool_output = await orchestrator.call_tool("merchant", "search_merchants", args)
            structured_data = json.loads(tool_output)
            
        elif intent == "travel":
            tool_output = await orchestrator.call_tool("travel", "search_travel_options", args)
            structured_data = json.loads(tool_output)
            
        elif intent == "support":
            tool_output = await orchestrator.call_tool("support", "search_support", args)
            structured_data = json.loads(tool_output)
            
        else: # general intent
            tool_output = "No external tools invoked."
            structured_data = None
            
    except Exception as e:
        print(f"Error executing MCP tool: {e}")
        tool_output = f"Tool execution failed: {str(e)}"
        structured_data = None

    # 3. Response Generation
    text_response = await generate_conversational_response(
        query=query,
        intent=intent,
        tool_output=tool_output,
        history=history_dict
    )
    
    # 4. Text-to-Speech (TTS)
    voice_audio = await synthesize_speech(text_response)
    
    # 5. Save history
    session_memory[session_id].append({"role": "user", "content": query})
    session_memory[session_id].append({"role": "assistant", "content": text_response})
    
    return ChatResponse(
        text=text_response,
        voice_audio_base64=voice_audio,
        intent=intent,
        structured_data=structured_data
    )

@app.post("/api/voice-chat")
async def voice_chat_endpoint(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None)
):
    """Voice-in, Voice-out conversation endpoint."""
    # Read file bytes
    file_bytes = await file.read()
    
    # 1. Speech to Text
    transcription = await transcribe_audio(file_bytes, file.filename)
    print(f"Transcribed audio: '{transcription}'")
    
    # Convert parameters to ChatRequest
    chat_req = ChatRequest(
        query=transcription,
        session_id=session_id,
        history=[], # Maintained internally or sent
        latitude=latitude,
        longitude=longitude
    )
    
    # Use existing chat logic
    response = await chat_endpoint(chat_req)
    
    # Include transcription in result
    res_dict = response.model_dump()
    res_dict["transcription"] = transcription
    return res_dict

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
