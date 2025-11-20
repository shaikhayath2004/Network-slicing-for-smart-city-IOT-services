import PropTypes from "prop-types";

const severityColor = {
  info: "#2563eb",
  warning: "#f59e0b",
  critical: "#dc2626"
};

export default function AlertsPanel({ alerts, onResolve }) {
  if (!alerts.length) {
    return <p className="muted">No active alerts.</p>;
  }

  return (
    <ul className="alerts-list">
      {alerts.map((alert) => (
        <li key={alert.id} className="alert-row">
          <span className="severity-pill" style={{ background: severityColor[alert.severity] }}>
            {alert.severity}
          </span>
          <div>
            <p className="alert-title">{alert.title}</p>
            <p className="muted">{alert.description}</p>
            {onResolve ? (
              <button className="link-btn" type="button" onClick={() => onResolve(alert.id)}>
                Resolve
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

AlertsPanel.propTypes = {
  alerts: PropTypes.array.isRequired,
  onResolve: PropTypes.func
};

