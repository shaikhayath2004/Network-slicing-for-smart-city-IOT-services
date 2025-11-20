import PropTypes from "prop-types";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function TrafficChart({ slice }) {
  const data = slice.metrics.slice(-30).map((metric) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    throughput: metric.throughput_mbps,
    latency: metric.latency_ms
  }));

  if (!data.length) {
    return <p className="muted">No telemetry yet.</p>;
    }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="time" hide />
        <YAxis yAxisId="left" stroke="#16a34a" />
        <YAxis yAxisId="right" orientation="right" stroke="#2563eb" />
        <Tooltip />
        <Line yAxisId="left" type="monotone" dataKey="throughput" stroke="#16a34a" dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#2563eb" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

TrafficChart.propTypes = {
  slice: PropTypes.object.isRequired
};

