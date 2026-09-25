import { useMemo, useState } from "react";
import {
  GitCompareArrows,
  Info,
} from "lucide-react";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useSalesData } from "../context/SalesDataContext";

const SCATTER_SAMPLE_SIZE = 1500;

function Correlation() {
  const [selectedPair, setSelectedPair] =
    useState("quantity-revenue");

  const {
    salesRecords,
    isImported,
  } = useSalesData();

  /*
   * IMPORTANT:
   * Pearson calculations use the COMPLETE cleaned dataset.
   *
   * Only the scatter plot is sampled because rendering
   * hundreds of thousands of SVG points will freeze the browser.
   */
  const correlationData = useMemo(() => {
    const pairs = [
      {
        id: "quantity-revenue",
        variableA: "Quantity",
        variableB: "Revenue",
        keyA: "quantity",
        keyB: "revenue",
      },
      {
        id: "price-quantity",
        variableA: "Unit Price",
        variableB: "Quantity",
        keyA: "unitPrice",
        keyB: "quantity",
      },
      {
        id: "quantity-price",
        variableA: "Quantity",
        variableB: "Unit Price",
        keyA: "quantity",
        keyB: "unitPrice",
      },
    ];

    return pairs.map((pair) => {
      const validRows = [];

      for (
        let i = 0;
        i < salesRecords.length;
        i += 1
      ) {
        const row = salesRecords[i];

        const x = Number(row[pair.keyA]);
        const y = Number(row[pair.keyB]);

        if (
          Number.isFinite(x) &&
          Number.isFinite(y)
        ) {
          validRows.push({
            x,
            y,
            label: row.product,
            id:
              row.invoiceNo ||
              row.id ||
              i,
          });
        }
      }

      /*
       * FULL DATASET CORRELATION
       */
      const valuesA = new Array(
        validRows.length
      );

      const valuesB = new Array(
        validRows.length
      );

      for (
        let i = 0;
        i < validRows.length;
        i += 1
      ) {
        valuesA[i] = validRows[i].x;
        valuesB[i] = validRows[i].y;
      }

      const coefficient =
        pearsonCorrelation(
          valuesA,
          valuesB
        );

      /*
       * SCATTER PLOT SAMPLE
       *
       * Uses evenly distributed records instead
       * of rendering hundreds of thousands of points.
       */
      const scatterData =
        createScatterSample(
          validRows,
          SCATTER_SAMPLE_SIZE
        );

      return {
        ...pair,
        coefficient,
        strength:
          getStrength(coefficient),
        direction:
          getDirection(coefficient),
        data: scatterData,
        observationCount:
          validRows.length,
      };
    });
  }, [salesRecords]);

  const selected =
    correlationData.find(
      (item) =>
        item.id === selectedPair
    ) ||
    correlationData[0] || {
      variableA: "Quantity",
      variableB: "Revenue",
      coefficient: 0,
      strength: "Very Weak",
      direction: "NEUTRAL",
      data: [],
      observationCount: 0,
    };

  const interpretation =
    getInterpretation(
      selected.coefficient,
      selected.variableA,
      selected.variableB
    );

  /*
   * CORRELATION MATRIX
   *
   * All values are calculated from the complete
   * cleaned dataset.
   */
  const matrix = useMemo(() => {
    const quantityRevenue =
      calculateDirectCorrelation(
        salesRecords,
        "quantity",
        "revenue"
      );

    const quantityPrice =
      calculateDirectCorrelation(
        salesRecords,
        "quantity",
        "unitPrice"
      );

    const priceRevenue =
      calculateDirectCorrelation(
        salesRecords,
        "unitPrice",
        "revenue"
      );

    return {
      quantity: [
        1,
        quantityPrice,
        quantityRevenue,
      ],

      unitPrice: [
        quantityPrice,
        1,
        priceRevenue,
      ],

      revenue: [
        quantityRevenue,
        priceRevenue,
        1,
      ],
    };
  }, [salesRecords]);

  if (
    !isImported ||
    !salesRecords.length
  ) {
    return (
      <div className="correlation-page">
        <section className="correlation-heading">
          <div>
            <div className="section-kicker">
              <span className="kicker-block">
                05
              </span>

              CORRELATION ANALYSIS
            </div>

            <h1>
              VARIABLE RELATIONSHIPS
            </h1>

            <p>
              Import a sales dataset to
              calculate Pearson correlations
              between numerical sales
              variables.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="correlation-page">
      {/* HEADER */}
      <section className="correlation-heading">
        <div>
          <div className="section-kicker">
            <span className="kicker-block">
              05
            </span>

            CORRELATION ANALYSIS
          </div>

          <h1>
            VARIABLE RELATIONSHIPS
          </h1>

          <p>
            Examine the relationship between
            numerical sales variables using
            Pearson correlation and scatter
            plot analysis.
          </p>
        </div>

        <div className="correlation-method">
          <span>METHOD</span>
          <strong>PEARSON&nbsp;r</strong>
        </div>
      </section>

      {/* PAIR SELECTOR */}
      <section className="correlation-selector">
        <div>
          <span className="studio-label">
            VARIABLE PAIR
          </span>

          <h2>
            CHOOSE VARIABLES TO COMPARE
          </h2>
        </div>

        <div className="pair-buttons">
          {correlationData.map((pair) => (
            <button
              key={pair.id}
              className={
                selectedPair === pair.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSelectedPair(pair.id)
              }
            >
              {pair.variableA}

              <GitCompareArrows
                size={14}
              />

              {pair.variableB}
            </button>
          ))}
        </div>
      </section>

      {/* CORRELATION SCORE */}
      <section className="correlation-score-grid">
        <div className="correlation-score-card purple">
          <span>
            PEARSON CORRELATION
          </span>

          <strong>
            {selected.coefficient >= 0
              ? "+"
              : ""}
            {selected.coefficient.toFixed(
              3
            )}
          </strong>

          <small>
            Range: -1.000 to +1.000
          </small>
        </div>

        <div className="correlation-score-card yellow">
          <span>RELATIONSHIP</span>

          <strong>
            {selected.direction}
          </strong>

          <small>
            Direction of the observed
            relationship
          </small>
        </div>

        <div className="correlation-score-card pink">
          <span>STRENGTH</span>

          <strong>
            {selected.strength}
          </strong>

          <small>
            Based on the absolute
            correlation value
          </small>
        </div>

        <div className="correlation-score-card white">
          <span>OBSERVATIONS</span>

          <strong>
            {selected.observationCount.toLocaleString()}
          </strong>

          <small>
            Complete valid records used
            in calculation
          </small>
        </div>
      </section>

      {/* SCATTER PLOT */}
      <section className="correlation-chart-card">
        <div className="correlation-card-header">
          <div>
            <span className="studio-label">
              SCATTER PLOT
            </span>

            <h2>
              {selected.variableA.toUpperCase()}{" "}
              VS{" "}
              {selected.variableB.toUpperCase()}
            </h2>
          </div>

          <div className="correlation-badge">
            r ={" "}
            {selected.coefficient.toFixed(
              3
            )}
          </div>
        </div>

        <div className="scatter-container">
          <ResponsiveContainer
            width="100%"
            height={430}
          >
            <ScatterChart
              margin={{
                top: 20,
                right: 30,
                bottom: 35,
                left: 15,
              }}
            >
              <CartesianGrid
                stroke="#111"
                strokeDasharray="4 4"
                opacity={0.15}
              />

              <XAxis
                type="number"
                dataKey="x"
                name={selected.variableA}
                tick={{
                  fill: "#111",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#111",
                  strokeWidth: 2,
                }}
                tickLine={false}
              />

              <YAxis
                type="number"
                dataKey="y"
                name={selected.variableB}
                tick={{
                  fill: "#111",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#111",
                  strokeWidth: 2,
                }}
                tickLine={false}
              />

              <Tooltip
                cursor={{
                  strokeDasharray: "4 4",
                }}
                formatter={(
                  value,
                  name
                ) => [
                  Number(
                    value
                  ).toLocaleString(
                    "en-GB",
                    {
                      maximumFractionDigits: 2,
                    }
                  ),
                  name === "x"
                    ? selected.variableA
                    : selected.variableB,
                ]}
                labelFormatter={(
                  _,
                  payload
                ) => {
                  const point =
                    payload?.[0]
                      ?.payload;

                  return point
                    ? `${point.id} — ${point.label}`
                    : "";
                }}
                contentStyle={{
                  border:
                    "3px solid #111",
                  boxShadow:
                    "5px 5px 0 #111",
                  fontFamily:
                    "Public Sans",
                  fontWeight: 700,
                }}
              />

              <Scatter
                name="Sales Records"
                data={selected.data}
                fill="#f08cb6"
                stroke="#111"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            padding:
              "10px 18px 16px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing:
              "0.04em",
            opacity: 0.65,
          }}
        >
          SCATTER DISPLAY:
          {selected.data.length.toLocaleString()}{" "}
          sampled points · PEARSON r uses all{" "}
          {selected.observationCount.toLocaleString()}{" "}
          valid records
        </div>
      </section>

      {/* INTERPRETATION */}
      <section className="correlation-interpretation">
        <div className="correlation-info-icon">
          <Info size={25} />
        </div>

        <div>
          <span className="studio-label">
            STATISTICAL INTERPRETATION
          </span>

          <h2>
            {selected.variableA} &{" "}
            {selected.variableB}
          </h2>

          <p>{interpretation}</p>
        </div>
      </section>

      {/* CORRELATION MATRIX */}
      <section className="correlation-matrix-card">
        <div className="correlation-card-header yellow-correlation-header">
          <div>
            <span className="studio-label">
              CORRELATION MATRIX
            </span>

            <h2>
              VARIABLE RELATIONSHIP SUMMARY
            </h2>
          </div>
        </div>

        <div className="matrix-wrapper">
          <table className="correlation-matrix">
            <thead>
              <tr>
                <th>VARIABLE</th>
                <th>QUANTITY</th>
                <th>UNIT PRICE</th>
                <th>REVENUE</th>
              </tr>
            </thead>

            <tbody>
              <MatrixRow
                label="Quantity"
                values={matrix.quantity}
              />

              <MatrixRow
                label="Unit Price"
                values={matrix.unitPrice}
              />

              <MatrixRow
                label="Revenue"
                values={matrix.revenue}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* CAUTION */}
      <section className="correlation-note">
        <div className="note-mark">!</div>

        <div>
          <span className="studio-label">
            ANALYTICAL NOTE
          </span>

          <h2>
            CORRELATION IS NOT CAUSATION
          </h2>

          <p>
            A correlation coefficient describes
            the strength and direction of a
            linear relationship between two
            variables. It does not by itself
            establish that one variable causes
            changes in another variable.
          </p>
        </div>
      </section>
    </div>
  );
}

/*
 * Pearson correlation
 *
 * This receives the COMPLETE arrays.
 * No sampling happens here.
 */
function pearsonCorrelation(x, y) {
  if (
    !x.length ||
    x.length !== y.length
  ) {
    return 0;
  }

  const meanX = average(x);
  const meanY = average(y);

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (
    let i = 0;
    i < x.length;
    i += 1
  ) {
    const differenceX =
      x[i] - meanX;

    const differenceY =
      y[i] - meanY;

    numerator +=
      differenceX * differenceY;

    denominatorX +=
      differenceX ** 2;

    denominatorY +=
      differenceY ** 2;
  }

  const denominator = Math.sqrt(
    denominatorX * denominatorY
  );

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}

/*
 * Evenly samples the dataset for visualization.
 *
 * Example:
 * 524,878 records
 *        ↓
 * 1,500 displayed points
 *
 * This DOES NOT affect Pearson r.
 */
function createScatterSample(
  rows,
  maxPoints
) {
  if (rows.length <= maxPoints) {
    return rows;
  }

  const sample = new Array(
    maxPoints
  );

  const step =
    (rows.length - 1) /
    (maxPoints - 1);

  for (
    let i = 0;
    i < maxPoints;
    i += 1
  ) {
    const index = Math.round(
      i * step
    );

    sample[i] = rows[index];
  }

  return sample;
}

function getStrength(value) {
  const absolute = Math.abs(value);

  if (absolute >= 0.8)
    return "Very Strong";

  if (absolute >= 0.6)
    return "Strong";

  if (absolute >= 0.4)
    return "Moderate";

  if (absolute >= 0.2)
    return "Weak";

  return "Very Weak";
}

function getDirection(value) {
  if (value > 0.05)
    return "POSITIVE";

  if (value < -0.05)
    return "NEGATIVE";

  return "NEUTRAL";
}

function getInterpretation(
  coefficient,
  variableA,
  variableB
) {
  const absolute =
    Math.abs(coefficient);

  if (absolute < 0.2) {
    return `The calculated Pearson correlation between ${variableA} and ${variableB} indicates a very weak linear relationship in the current dataset. Changes in one variable show little linear association with changes in the other.`;
  }

  if (coefficient >= 0) {
    return `The calculated Pearson correlation between ${variableA} and ${variableB} is positive. Higher values of ${variableA} tend to be associated with higher values of ${variableB} within the observed records. The strength of this relationship is ${getStrength(
      coefficient
    ).toLowerCase()}.`;
  }

  return `The calculated Pearson correlation between ${variableA} and ${variableB} is negative. Higher values of ${variableA} tend to be associated with lower values of ${variableB} within the observed records. The strength of this relationship is ${getStrength(
    coefficient
  ).toLowerCase()}.`;
}

function calculateDirectCorrelation(
  records,
  a,
  b
) {
  const x = [];
  const y = [];

  for (
    let i = 0;
    i < records.length;
    i += 1
  ) {
    const valueA = Number(
      records[i][a]
    );

    const valueB = Number(
      records[i][b]
    );

    if (
      Number.isFinite(valueA) &&
      Number.isFinite(valueB)
    ) {
      x.push(valueA);
      y.push(valueB);
    }
  }

  return pearsonCorrelation(x, y);
}

function MatrixRow({
  label,
  values,
}) {
  return (
    <tr>
      <th>{label}</th>

      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className={
            value > 0.2
              ? "matrix-positive"
              : value < -0.2
              ? "matrix-negative"
              : "matrix-neutral"
          }
        >
          {value === 1
            ? "1.000"
            : value.toFixed(3)}
        </td>
      ))}
    </tr>
  );
}

export default Correlation;