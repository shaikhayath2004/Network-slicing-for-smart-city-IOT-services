import asyncio
from typing import Any, Dict


class OpenDaylightClient:
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url
        self.username = username
        self.password = password

    async def push_flow_rules(self, slice_id: str, rules: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.1)
        return {"slice_id": slice_id, "state": "rules-installed", "rules": rules}

