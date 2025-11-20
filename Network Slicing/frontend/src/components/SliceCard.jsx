import PropTypes from "prop-types";

function statusColor(status) {
  switch (status) {
    case "active":
      return "#16a34a";
    case "degraded":
      return "#dc2626";
    case "provisioning":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

export default function SliceCard({ slice, isSelected = false, onSelect }) {
  const lastMetric = slice.metrics.at(-1);
  return (
    <button
      type="button"
      className={`card slice-card ${isSelected ? "selected-card" : ""}`}
      onClick={() => onSelect?.(slice.id)}
    >
      <div className="card-header">
        <h3>{slice.name}</h3>
        <span className="status-pill" style={{ background: statusColor(slice.status) }}>
          {slice.status}
        </span>
      </div>
      <p className="muted">Tenant: {slice.tenant}</p>
      <p className="muted">QoS: {slice.qos_class}</p>
      <p className="muted">Devices: {slice.devices.length}</p>
      {lastMetric ? (
        <div className="metric-grid">
          <div>
            <span className="metric-label">Throughput</span>
            <span className="metric-value">{lastMetric.throughput_mbps.toFixed(1)} Mbps</span>
          </div>
          <div>
            <span className="metric-label">Latency</span>
            <span className="metric-value">{lastMetric.latency_ms.toFixed(1)} ms</span>
          </div>
          <div>
            <span className="metric-label">Loss</span>
            <span className="metric-value">{lastMetric.packet_loss.toFixed(2)}%</span>
          </div>
        </div>
      ) : (
        <p className="muted">Waiting for telemetry...</p>
      )}
    </button>
  );
}

SliceCard.propTypes = {
  slice: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func
};

