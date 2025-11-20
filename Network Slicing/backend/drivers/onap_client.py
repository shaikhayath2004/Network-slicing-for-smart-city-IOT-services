import asyncio
from typing import Any, Dict


class ONAPClient:
    def __init__(self, base_url: str):
        self.base_url = base_url

    async def instantiate_slice(self, descriptor: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.2)
        return {"slice_id": descriptor["id"], "state": "instantiated"}

    async def get_slice_metrics(self, slice_id: str) -> Dict[str, Any]:
        await asyncio.sleep(0.05)
        return {
            "throughput_mbps": 120 + hash(slice_id) % 30,
            "latency_ms": 15 + hash(slice_id) % 5,
            "packet_loss": 0.3,
            "energy_score": 0.8,
        }

