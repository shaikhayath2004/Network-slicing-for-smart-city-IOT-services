import { useEffect, useState } from "react";
import {
  addDevice,
  createSlice,
  createSliceAlert,
  fetchSlice,
  fetchSliceAlerts,
  fetchSlices,
  resolveAlert
} from "./api";
import SliceCard from "./components/SliceCard.jsx";
import TrafficChart from "./components/TrafficChart.jsx";
import AlertsPanel from "./components/AlertsPanel.jsx";

const statusColor = {
  active: "#16a34a",
  degraded: "#dc2626",
  provisioning: "#f59e0b",
  error: "#6b7280"
};

const getStatusColor = (status) => statusColor[status] ?? "#6b7280";

const emptyForm = {
  name: "",
  tenant: "",
  qos_class: "gold",
  devices: ""
};

export default function App() {
  const [slices, setSlices] = useState([]);
  const [selectedSliceId, setSelectedSliceId] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [sliceAlerts, setSliceAlerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [deviceInput, setDeviceInput] = useState("");
  const [alertForm, setAlertForm] = useState({
    title: "",
    description: "",
    severity: "warning"
  });
  const [loadingSlice, setLoadingSlice] = useState(false);

  useEffect(() => {
    const poll = async () => {
      const sliceData = await fetchSlices();
      setSlices(sliceData);
      if (!selectedSliceId && sliceData.length) {
        setSelectedSliceId(sliceData[0].id);
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedSliceId]);

  useEffect(() => {
    if (!selectedSliceId) {
      setSelectedSlice(null);
      setSliceAlerts([]);
      return;
    }
    const loadSlice = async () => {
      setLoadingSlice(true);
      const [details, alertsForSlice] = await Promise.all([
        fetchSlice(selectedSliceId),
        fetchSliceAlerts(selectedSliceId)
      ]);
      setSelectedSlice(details);
      setSliceAlerts(alertsForSlice);
      setLoadingSlice(false);
    };
    loadSlice();
    const interval = setInterval(loadSlice, 5000);
    return () => clearInterval(interval);
  }, [selectedSliceId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        tenant: form.tenant,
        qos_class: form.qos_class,
        devices: form.devices.split(",").map((device) => device.trim()).filter(Boolean)
      };
      const slice = await createSlice(payload);
      setSlices((prev) => [...prev, slice]);
      setSelectedSliceId(slice.id);
      setForm(emptyForm);
    } finally {
      setBusy(false);
    }
  };

  const handleDeviceAdd = async (event) => {
    event.preventDefault();
    if (!selectedSliceId || !deviceInput.trim()) return;
    await addDevice(selectedSliceId, { device_id: deviceInput.trim() });
    setDeviceInput("");
    const updated = await fetchSlice(selectedSliceId);
    setSelectedSlice(updated);
  };

  const handleAlertSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSliceId) return;
    await createSliceAlert(selectedSliceId, alertForm);
    setAlertForm({ title: "", description: "", severity: "warning" });
    const alerts = await fetchSliceAlerts(selectedSliceId);
    setSliceAlerts(alerts);
  };

  const handleResolveAlert = async (alertId) => {
    await resolveAlert(alertId);
    const alerts = await fetchSliceAlerts(selectedSliceId);
    setSliceAlerts(alerts);
  };

  return (
    <div className="layout">
      <header>
        <h1>Smart City Slice Dashboard</h1>
        <p className="muted">Real-time visibility into ONOS + OpenDaylight slices orchestrated by ONAP.</p>
      </header>

      <section className="slice-layout">
        <div className="card slice-list">
          <h2>Slices</h2>
          <p className="muted">Click a slice to view details, telemetry, and alerts.</p>
          <div className="slice-list-scroll">
            {slices.length ? (
              slices.map((slice) => (
                <SliceCard
                  key={slice.id}
                  slice={slice}
                  isSelected={slice.id === selectedSliceId}
                  onSelect={setSelectedSliceId}
                />
              ))
            ) : (
              <p className="muted">No slices yet.</p>
            )}
          </div>
        </div>

        <div className="card slice-detail">
          {loadingSlice ? (
            <p>Loading slice...</p>
          ) : selectedSlice ? (
            <>
              <div className="detail-header">
                <div>
                  <h2>{selectedSlice.name}</h2>
                  <p className="muted">Tenant: {selectedSlice.tenant}</p>
                </div>
                <span className="status-pill" style={{ background: getStatusColor(selectedSlice.status) }}>
                  {selectedSlice.status}
                </span>
              </div>

              <div className="detail-grid">
                <div>
                  <p className="muted">QoS Class</p>
                  <strong>{selectedSlice.qos_class}</strong>
                </div>
                <div>
                  <p className="muted">Devices</p>
                  <strong>{selectedSlice.devices.length}</strong>
                </div>
              </div>

              <h3>Devices</h3>
              <ul className="device-list">
                {selectedSlice.devices.map((device) => (
                  <li key={device}>{device}</li>
                ))}
              </ul>
              <form className="inline-form" onSubmit={handleDeviceAdd}>
                <input
                  placeholder="Add device ID"
                  value={deviceInput}
                  onChange={(e) => setDeviceInput(e.target.value)}
                />
                <button type="submit">Add Device</button>
              </form>

              <h3>Telemetry</h3>
              <TrafficChart slice={selectedSlice} />

              <div className="alerts-section">
                <div className="section-heading">
                  <h3>Alerts</h3>
                  <span className="badge">{sliceAlerts.length}</span>
                </div>
                <AlertsPanel alerts={sliceAlerts} onResolve={handleResolveAlert} />
                <form className="alert-form" onSubmit={handleAlertSubmit}>
                  <input
                    placeholder="Alert title"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Alert description"
                    value={alertForm.description}
                    onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                    required
                  />
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button type="submit">Trigger Alert</button>
                </form>
              </div>
            </>
          ) : (
            <p>Select a slice to inspect details.</p>
          )}
        </div>
      </section>

      <section className="card form-card">
        <h2>Provision New Slice</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Tenant
            <input value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })} required />
          </label>
          <label>
            QoS Class
            <select value={form.qos_class} onChange={(e) => setForm({ ...form, qos_class: e.target.value })}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </label>
          <label>
            Device IDs (comma separated)
            <input value={form.devices} onChange={(e) => setForm({ ...form, devices: e.target.value })} />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Provisioning..." : "Create Slice"}
          </button>
        </form>
      </section>
    </div>
  );
}

