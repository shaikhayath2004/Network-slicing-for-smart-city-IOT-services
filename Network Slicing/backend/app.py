import asyncio
import random
import uuid

from fastapi import FastAPI, HTTPException

from .config import get_settings
from .drivers.onap_client import ONAPClient
from .drivers.onos_client import ONOSClient
from .drivers.opendaylight_client import OpenDaylightClient
from .models import AddDeviceRequest, CreateAlertRequest, CreateSliceRequest, SliceMetric
from .services.slice_manager import SliceManager

settings = get_settings()

app = FastAPI(title="Smart City Slice Manager", version="1.0.0")


onos_client = ONOSClient(settings.onos_url, settings.controller_user, settings.controller_password)
odl_client = OpenDaylightClient(settings.opendaylight_url, settings.controller_user, settings.controller_password)
onap_client = ONAPClient(settings.onap_url)
slice_manager = SliceManager(onos_client, odl_client, onap_client)


@app.get("/api/health")
def read_health():
    return {"status": "ok"}


@app.get("/api/slices")
def list_slices():
    return list(slice_manager.list_slices())


@app.post("/api/slices", status_code=201)
async def create_slice(payload: CreateSliceRequest):
    new_slice = await slice_manager.create_slice(payload)
    return new_slice


@app.get("/api/slices/{slice_id}")
def read_slice(slice_id: str):
    slice_obj = slice_manager.get_slice(slice_id)
    if not slice_obj:
        raise HTTPException(status_code=404, detail="Slice not found")
    return slice_obj


@app.post("/api/slices/{slice_id}/metrics")
def ingest_metric(slice_id: str, metric: SliceMetric):
    slice_manager.append_metric(slice_id, metric)
    return {"status": "accepted"}


@app.get("/api/alerts")
def list_alerts():
    return slice_manager.list_alerts()


@app.get("/api/slices/{slice_id}/alerts")
def list_slice_alerts(slice_id: str):
    slice_obj = slice_manager.get_slice(slice_id)
    if not slice_obj:
        raise HTTPException(status_code=404, detail="Slice not found")
    return slice_manager.list_alerts_for_slice(slice_id)


@app.post("/api/slices/{slice_id}/devices", status_code=200)
def add_device(slice_id: str, payload: AddDeviceRequest):
    try:
        updated = slice_manager.add_device(slice_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Slice not found")
    return updated


@app.post("/api/slices/{slice_id}/alerts", status_code=201)
def create_alert(slice_id: str, payload: CreateAlertRequest):
    try:
        alert = slice_manager.create_alert(slice_id, payload)
    except KeyError:
        raise HTTPException(status_code=404, detail="Slice not found")
    return alert


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    deleted = slice_manager.resolve_alert(alert_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved"}


async def _metric_simulator():
    while settings.enable_simulator:
        await asyncio.sleep(settings.poll_interval_seconds)
        for slice_obj in slice_manager.list_slices():
            metric = SliceMetric(
                throughput_mbps=random.uniform(80, 200),
                latency_ms=random.uniform(10, 100),
                packet_loss=random.uniform(0, 5),
                energy_score=random.uniform(0.6, 0.95),
            )
            slice_manager.append_metric(slice_obj.id, metric)


@app.on_event("startup")
async def startup_event():
    if settings.enable_simulator:
        if not list(slice_manager.list_slices()):
            await slice_manager.create_slice(
                CreateSliceRequest(
                    name="City CCTV slice",
                    tenant="SmartCityOps",
                    qos_class="gold",
                    devices=[f"cctv-{i}" for i in range(5)],
                )
            )
            await slice_manager.create_slice(
                CreateSliceRequest(
                    name="Traffic Sensors slice",
                    tenant="SmartCityOps",
                    qos_class="silver",
                    devices=[f"traffic-{i}" for i in range(10)],
                )
            )
        asyncio.create_task(_metric_simulator())

