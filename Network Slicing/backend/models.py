from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class SliceStatus(str, Enum):
    active = "active"
    degraded = "degraded"
    provisioning = "provisioning"
    error = "error"


class QoSClass(str, Enum):
    gold = "gold"
    silver = "silver"
    bronze = "bronze"


class SliceMetric(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    throughput_mbps: float
    latency_ms: float
    packet_loss: float
    energy_score: float


class Slice(BaseModel):
    id: str
    name: str
    tenant: str
    qos_class: QoSClass
    status: SliceStatus = SliceStatus.provisioning
    devices: List[str] = Field(default_factory=list)
    metrics: List[SliceMetric] = Field(default_factory=list)


class CreateSliceRequest(BaseModel):
    name: str
    tenant: str
    qos_class: QoSClass
    devices: List[str] = Field(default_factory=list)


class AlertSeverity(str, Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class Alert(BaseModel):
    id: str
    slice_id: Optional[str] = None
    title: str
    description: str
    severity: AlertSeverity = AlertSeverity.info
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AddDeviceRequest(BaseModel):
    device_id: str


class CreateAlertRequest(BaseModel):
    title: str
    description: str
    severity: AlertSeverity = AlertSeverity.warning

