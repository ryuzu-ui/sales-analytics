import {
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function StatCard({
  label,
  value,
  change,
  description,
  accent = "yellow",
  positive = true,
}) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <div className="stat-card-top">
        <span>{label}</span>

        <div className={`stat-change ${positive ? "positive" : "negative"}`}>
          {positive ? (
            <ArrowUpRight size={15} />
          ) : (
            <ArrowDownRight size={15} />
          )}

          {change}
        </div>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-description">
        {description}
      </div>
    </div>
  );
}

export default StatCard;