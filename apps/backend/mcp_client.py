import asyncio
import os
from typing import Dict, Any, List
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCPOrchestrator:
    def __init__(self):
        self.sessions: Dict[str, ClientSession] = {}
        self._exit_stacks: List[Any] = []

    async def start(self):
        # Locate the monorepo root directory
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        
        servers = {
            "merchant": {
                "command": "uv",
                "args": [
                    "run", 
                    "--project", os.path.join(base_dir, "mcp", "merchant-mcp"), 
                    "python", os.path.join(base_dir, "mcp", "merchant-mcp", "server.py")
                ]
            },
            "travel": {
                "command": "uv",
                "args": [
                    "run", 
                    "--project", os.path.join(base_dir, "mcp", "travel-mcp"), 
                    "python", os.path.join(base_dir, "mcp", "travel-mcp", "server.py")
                ]
            },
            "support": {
                "command": "uv",
                "args": [
                    "run", 
                    "--project", os.path.join(base_dir, "mcp", "support-mcp"), 
                    "python", os.path.join(base_dir, "mcp", "support-mcp", "server.py")
                ]
            }
        }
        
        for name, cfg in servers.items():
            try:
                print(f"Starting {name} MCP server as a stdio subprocess...")
                params = StdioServerParameters(
                    command=cfg["command"],
                    args=cfg["args"]
                )
                
                # Enter stdio client connection
                ctx = stdio_client(params)
                read_stream, write_stream = await ctx.__aenter__()
                
                # Create and initialize client session
                session = ClientSession(read_stream, write_stream)
                await session.__aenter__()
                await session.initialize()
                
                self.sessions[name] = session
                self._exit_stacks.append((ctx, session))
                print(f"✅ Connected & initialized: {name} MCP server")
            except Exception as e:
                print(f"❌ Failed to boot up {name} MCP server: {e}")

    async def stop(self):
        print("Stopping all MCP client subprocesses...")
        for ctx, session in reversed(self._exit_stacks):
            try:
                await session.__aexit__(None, None, None)
                await ctx.__aexit__(None, None, None)
            except Exception as e:
                print(f"Error during clean shutdown: {e}")
        self.sessions.clear()
        self._exit_stacks.clear()

    async def call_tool(self, server_name: str, tool_name: str, arguments: Dict[str, Any]) -> str:
        session = self.sessions.get(server_name)
        if not session:
            raise ValueError(f"MCP server '{server_name}' is not running or initialized.")
        
        print(f"Calling tool '{tool_name}' on server '{server_name}' with args: {arguments}")
        result = await session.call_tool(tool_name, arguments)
        
        if not result.content:
            return ""
        # FastMCP tools return stringified values in the content[0].text
        return result.content[0].text
