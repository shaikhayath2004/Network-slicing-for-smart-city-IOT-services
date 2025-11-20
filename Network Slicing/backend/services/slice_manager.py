from __future__ import annotations

import asyncio
import uuid
from typing import Dict, Iterable, List

from ..drivers.onap_client import ONAPClient
from ..drivers.onos_client import ONOSClient
from ..drivers.opendaylight_client import OpenDaylightClient
from ..models import (
    AddDeviceRequest,
    Alert,
    AlertSeverity,
    CreateAlertRequest,
    CreateSliceRequest,
    Slice,
    SliceMetric,
    SliceStatus,
)


class SliceManager:
    def __init__(self, onos: ONOSClient, odl: OpenDaylightClient, onap: ONAPClient):
        self.onos = onos
        self.odl = odl
        self.onap = onap
        self._slices: Dict[str, Slice] = {}
        self._alerts: List[Alert] = []

    def list_slices(self) -> Iterable[Slice]:
        return self._slices.values()

    def get_slice(self, slice_id: str) -> Slice | None:
        return self._slices.get(slice_id)

    def list_alerts(self) -> List[Alert]:
        return list(self._alerts)
    def list_alerts_for_slice(self, slice_id: str) -> List[Alert]:
        return [alert for alert in self._alerts if alert.slice_id == slice_id]

    async def create_slice(self, payload: CreateSliceRequest) -> Slice:
        slice_id = payload.name.lower().replace(" ", "-") + f"-{uuid.uuid4().hex[:6]}"
        new_slice = Slice(
            id=slice_id,
            name=payload.name,
            tenant=payload.tenant,
            qos_class=payload.qos_class,
            status=SliceStatus.provisioning,
            devices=payload.devices,
        )
        self._slices[slice_id] = new_slice

        descriptor = new_slice.model_dump()
        descriptor["devices"] = payload.devices
        await asyncio.gather(
            self.onos.configure_slice(slice_id, descriptor),
            self.odl.push_flow_rules(slice_id, {"match": "iot", "action": "forward"}),
            self.onap.instantiate_slice({"id": slice_id}),
        )
        new_slice.status = SliceStatus.active
        return new_slice

    def append_metric(self, slice_id: str, metric: SliceMetric) -> None:
        slice_obj = self._slices.get(slice_id)
        if not slice_obj:
            self._alerts.append(
                Alert(
                    id=uuid.uuid4().hex,
                    slice_id=slice_id,
                    title="Metric Received for Unknown Slice",
                    description="A metric payload was received for a slice that does not exist.",
                    severity=AlertSeverity.warning,
                )
            )
            return
        slice_obj.metrics.append(metric)
        if len(slice_obj.metrics) > 50:
            slice_obj.metrics = slice_obj.metrics[-50:]
        self._evaluate_health(slice_obj, metric)

    def add_device(self, slice_id: str, payload: AddDeviceRequest) -> Slice:
        slice_obj = self._slices.get(slice_id)
        if not slice_obj:
            raise KeyError("Slice not found")
        if payload.device_id not in slice_obj.devices:
            slice_obj.devices.append(payload.device_id)
        return slice_obj

    def create_alert(self, slice_id: str, payload: CreateAlertRequest) -> Alert:
        if slice_id not in self._slices:
            raise KeyError("Slice not found")
        alert = Alert(
            id=uuid.uuid4().hex,
            slice_id= slice_id,
            title=payload.title,
            description=payload.description,
            severity=payload.severity,
        )
        self._alerts.append(alert)
        return alert

    def resolve_alert(self, alert_id: str) -> bool:
        initial_len = len(self._alerts)
        self._alerts = [alert for alert in self._alerts if alert.id != alert_id]
        return len(self._alerts) != initial_len

    def _evaluate_health(self, slice_obj: Slice, metric: SliceMetric) -> None:
        if metric.packet_loss > 2 or metric.latency_ms > 80:
            slice_obj.status = SliceStatus.degraded
            self._alerts.append(
                Alert(
                    id=uuid.uuid4().hex,
                    slice_id=slice_obj.id,
                    title="QoS breach",
                    description="Packet loss or latency exceeded threshold.",
                    severity=AlertSeverity.critical,
                )
            )
        else:
            slice_obj.status = SliceStatus.active

