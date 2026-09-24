function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}) {
  return (
    <section className={`chart-card ${className}`}>
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="chart-card-body">
        {children}
      </div>
    </section>
  );
}

export default ChartCard;