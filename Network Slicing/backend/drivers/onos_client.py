import asyncio
from typing import Any, Dict, List


class ONOSClient:
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url
        self.username = username
        self.password = password

    async def list_devices(self) -> List[Dict[str, Any]]:
        await asyncio.sleep(0.05)
        return [
            {"id": "edge-1", "type": "iot-gateway", "status": "up"},
            {"id": "edge-2", "type": "iot-gateway", "status": "up"},
        ]

    async def configure_slice(self, slice_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.1)
        return {"slice_id": slice_id, "state": "configured", "payload": payload}

