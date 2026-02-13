let body = "Sun";

function drawPackedSun(data, containerName = "Sun") {
  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  const svg = d3.select("#viz")
    .attr("width", width)
    .attr("height", height)
    .html(""); // clear previous drawings

  // --- Black background ---
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black");

  const sunRadius = 200;

  // --- Draw Sun ---
  svg.append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", sunRadius)
    .attr("fill", "#FFD966")
    .attr("stroke", "#E6A800")
    .attr("stroke-width", 4);

  // --- Compute radii proportional to container volume ---
  data.children.forEach(d => {
    d.r = Math.cbrt(d.volumePct / 100) * sunRadius;
  });

  // --- Determine container ---
  let containerX = centerX;
  let containerY = centerY;
  let containerR = sunRadius;

  if (containerName !== "Sun") {
    const containerBody = data.children.find(d => d.name === containerName);
    if (containerBody) {
      containerR = containerBody.r;
    }
  }

  // --- Filter bodies ---
  const bodiesToPack = data.children.filter(d => d.r < 0.5 * containerR);

  // --- Initialize positions ---
  bodiesToPack.forEach(d => {
    d.x = containerX;
    d.y = containerY;
  });

  // --- Color scale ---
  const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(data.children.map(d => d.name));

  // --- Hover text ---
  const hoverText = svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("fill", "white")
    .text(`Hover over a body to see volume relative to ${containerName}`);

  // --- Draw bodies ---
  const bodyCircles = svg.append("g")
    .selectAll("circle")
    .data(bodiesToPack)
    .join("circle")
    .attr("r", d => d.r)
    .attr("fill", d => color(d.name))
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      hoverText.text(""); // clear existing text

      const discoveryText =
      !d.discoveryDate || d.discoveryDate === "NA"
        ? "Known since antiquity"
        : `Discovered on ${d.discoveryDate}`;

      hoverText
        .append("tspan")
        .attr("x", width / 2)
        .attr("dy", 0)
        .text(`${d.name}: ${d.volumePct.toFixed(4)}% of ${containerName} volume`);

      hoverText
        .append("tspan")
        .attr("x", width / 2)
        .attr("dy", 18)  // moves to next line
        .text(discoveryText);
    })
    .on("mouseout", () => {
      hoverText.text(`Hover over a body to see volume relative to ${containerName}`);
    })
    .on("click", (event, d) => {
      body = d.name;
      draw(body);

      if (window.updateDominanceFromOutside) {
        window.updateDominanceFromOutside(d.name);
      }
    });

  // --- Force simulation ---
  const simulation = d3.forceSimulation(bodiesToPack)
    .force("x", d3.forceX(containerX).strength(0.1))
    .force("y", d3.forceY(containerY).strength(0.1))
    .force("collide", d3.forceCollide(d => d.r + 1))
    .on("tick", () => {
      bodyCircles
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      // Keep bodies inside container
      bodiesToPack.forEach(d => {
        const dx = d.x - containerX;
        const dy = d.y - containerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist + d.r > containerR) {
          const angle = Math.atan2(dy, dx);
          d.x = containerX + (containerR - d.r) * Math.cos(angle);
          d.y = containerY + (containerR - d.r) * Math.sin(angle);
        }
      });
    });
}

function draw(body) {
  d3.csv("data/sol_data.csv").then(raw => {

    raw.forEach(d => {
      d.volume = +d.volume;
      d.discoveryDate = d.discoveryDate
    });

    const sun = raw.find(d => d.eName === body);
    const sunVolume = sun ? sun.volume : null;

    if (!sunVolume) {
      console.error("Body or volume not found in CSV");
      return;
    }

    const bodies = raw.filter(d =>
      d.eName !== "Sun" &&
      d.eName !== body &&
      !isNaN(d.volume) &&
      d.volume > 0
    );

    const data = {
      name: "Sun",
      children: bodies.map(d => ({
        name: d.eName,
        volumePct: d.volume / sunVolume * 100,
        isPlanet: d.isPlanet,
        orbits: d.orbits,
        discoveryDate: d.discoveryDate
      }))
    };

    drawPackedSun(data, body);
  });

  d3.select("#resetButton").text("🔄").on("click", () => {
    body = "Sun";
    draw(body);
  });
}

draw(body);
