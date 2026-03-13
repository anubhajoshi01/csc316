
// --- Precompute visualSize map ---
// --- Compute visual sizes for all planets (excluding Sun) ---
const planetColors = {
  mercury: "#b7b7b7",
  venus: "#d7b36a",
  earth: "#4a90e2",
  mars: "#c65a3a",
  jupiter: "#caa07a",
  saturn: "#e6d28a",
  uranus: "#76c7c0",
  neptune: "#3b5bd6",
  other: "#777",
  sun: "#FFD966"
};

function getPlanetColor(name) {
  const key = name.toLowerCase();
  return planetColors[key] || planetColors.other;
}

let visualSizeMap = {}; // maps planet name -> visual radius

d3.csv("data/sol_data.csv").then(raw => {
  // Convert volumes to numbers
  raw.forEach(d => { d.volume = +d.volume; });

  // Filter out bodies without volume AND exclude Sun
  const planets = raw.filter(d => !isNaN(d.volume) && d.volume > 0 && d.eName !== "Sun");

  // Compute min and max
  const minVol = d3.min(planets, d => d.volume);
  const maxVol = d3.max(planets, d => d.volume);
  console.log("Planet volumes range (excluding Sun):", minVol, maxVol);

  // Use a pow scale to exaggerate differences visually
  const sizeScale = d3.scalePow()
    .exponent(0.3) // adjust exponent to tweak relative differences
    .domain([minVol, maxVol])
    .range([4, 12]); // min and max radius in pixels

  // Build the map
  planets.forEach(d => {
    visualSizeMap[d.eName] = sizeScale(d.volume);
  });

  console.log("Visual sizes map:", visualSizeMap);
});

document.addEventListener("DOMContentLoaded", () => {
  let body = "Sun";
  let clickedPlanets = [];

  // --- Tooltip ---
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "5px")
    .style("border-radius", "5px");

  // --- Timeline Template ---
  function drawTimelineTemplate() {
    const svg = d3.select("#timelineSvg");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 20, bottom: 60, left: 60};
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const plot = svg.append("g")
      .attr("id", "timelineAxes")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const yLine = plotHeight / 2;

    // --- horizontal line ---
    plot.append("line")
      .attr("x1", 0).attr("x2", plotWidth)
      .attr("y1", yLine).attr("y2", yLine)
      .attr("stroke", "#999").attr("stroke-width", 2);

    // --- centuries ---
    const centuries = ["Antiquity", "1600s", "1700s", "1800s", "1900s", "2000s"];
    const xScale = d3.scalePoint()
      .domain(centuries)
      .range([0, plotWidth])
      .padding(0.5);

    // --- vertical ticks and labels ---
    plot.selectAll("line.century-tick")
      .data(centuries)
      .join("line")
      .attr("class", "century-tick")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", yLine - 10)
      .attr("y2", yLine + 10)
      .attr("stroke", "#555").attr("stroke-width", 1);

    plot.selectAll("text.century-label")
      .data(centuries)
      .join("text")
      .attr("class", "century-label")
      .attr("x", d => xScale(d))
      .attr("y", yLine + 25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => d);
  }

  // --- Add planet to timeline ---
  function addToTimeline(planet) {
    if (clickedPlanets.some(d => d.name === planet.name)) return;
    clickedPlanets.push(planet);
    updateTimeline();
  }

function updateTimeline() {
  const svg = d3.select("#timelineSvg");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const yLine = plotHeight / 2;

  // Remove previous points
  svg.selectAll("g#timelinePoints").remove();
  if (clickedPlanets.length === 0) return;

  const pointsGroup = svg
    .append("g")
    .attr("id", "timelinePoints")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const centuries = ["Antiquity", "1600s", "1700s", "1800s", "1900s", "2000s"];
  const xScale = d3.scalePoint()
    .domain(centuries)
    .range([0, plotWidth])
    .padding(0.5);

  // Helper to map year to century
  const parseCentury = (d) => {
    if (!d.discoveryDate || d.discoveryDate === "NA") return "Antiquity";
    const year = +d.discoveryDate.split("/")[2];
    if (year < 1600) return "Antiquity";
    if (year < 1700) return "1600s";
    if (year < 1800) return "1700s";
    if (year < 1900) return "1800s";
    if (year < 2000) return "1900s";
    return "2000s";
  };

  const centuryGroups = d3.group(clickedPlanets, parseCentury);

  centuryGroups.forEach((planets, century) => {
    if (century === "Antiquity") {
      // Click order, centered
      const centerX = xScale(century);
      const spacing = 15;
      const totalWidth = (planets.length - 1) * spacing;

      planets.forEach((planet, i) => {
        console.log(visualSizeMap[planet.name])
        pointsGroup.append("circle")
          .attr("cx", centerX - totalWidth / 2 + i * spacing)
          .attr("cy", yLine)
          .attr("r", visualSizeMap[planet.name] ) // ✅ use map here
          .attr("fill", getPlanetColor(planet.name))
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1)
              .html(`<strong>${planet.name}</strong><br>${!planet.discoveryDate || planet.discoveryDate === "NA" ? "Known since antiquity" : planet.discoveryDate}`)
              .style("color", "black")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      });

      
    

    } else {
      // Non-Antiquity: proportional x based on year
      const idx = centuries.indexOf(century);
      const centuryStartYear = { "1600s": 1600, "1700s": 1700, "1800s": 1800, "1900s": 1900, "2000s": 2000 }[century];
      const nextIdx = idx + 1;
      const nextTickX = nextIdx < centuries.length ? xScale(centuries[nextIdx]) : plotWidth;

      const xYearScale = d3.scaleLinear()
        .domain([centuryStartYear, centuryStartYear + 99])
        .range([xScale(century), nextTickX]);

      planets.forEach((planet, i) => {
        const year = +planet.discoveryDate.split("/")[2];
        pointsGroup.append("circle")
          .attr("cx", xYearScale(year))
          .attr("cy", yLine)
          .attr("r", visualSizeMap[planet.name] ) // ✅ use map here
          .attr("fill", getPlanetColor(planet.name))
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1)
              .html(`<strong>${planet.name}</strong><br>${planet.discoveryDate}`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0));
      });
    }
  });
}
  // --- Reset button ---
  d3.select("#resetButton").text("🔄").on("click", () => {
    body = "Sun";
    clickedPlanets = [];
    drawTimelineTemplate();
    draw(body);
  });

  // --- Circle Packing ---
  function drawPackedSun(data, containerName = "Sun") {
    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const svg = d3.select("#viz").attr("width", width).attr("height", height).html("");

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "black");

    const sunRadius = 200;
    svg.append("circle")
      .attr("cx", centerX).attr("cy", centerY)
      .attr("r", sunRadius)
      .attr("fill", getPlanetColor(containerName))
      .attr("stroke", "white")
      .attr("stroke-width", 4);

    data.children.forEach(d => d.r = Math.cbrt(d.volumePct / 100) * sunRadius);

    let containerX = centerX, containerY = centerY, containerR = sunRadius;
    if (containerName !== "Sun") {
      const containerBody = data.children.find(d => d.name === containerName);
      if (containerBody) containerR = containerBody.r;
    }

    const bodiesToPack = data.children.filter(d => d.r < 0.5 * containerR);
    bodiesToPack.forEach(d => { d.x = containerX; d.y = containerY; });

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.children.map(d => d.name));

    const hoverText = svg.append("text").attr("class", "hover-text")
      .attr("x", width / 2).attr("y", height - 20)
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text(`Hover over a body to see volume relative to ${containerName} and discovery date`);

    const bodyCircles = svg.append("g")
      .selectAll("circle")
      .data(bodiesToPack)
      .join("circle")
      .attr("r", d => d.r)
      .attr("fill", d => getPlanetColor(d.name))
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        hoverText.text("");
        const discoveryText = !d.discoveryDate || d.discoveryDate === "NA" ? "Known since antiquity" : `Discovered on ${d.discoveryDate}`;
        hoverText.append("tspan").attr("x", width / 2).attr("dy", 0)
          .text(`${d.name}: ${d.volumePct.toFixed(4)}% of ${containerName} volume`);
        hoverText.append("tspan").attr("x", width / 2).attr("dy", 18)
          .text(discoveryText);
      })
      .on("mouseout", () => hoverText.text(`Hover over a body to see volume relative to ${containerName} and discovery date`))
      .on("click", (event, d) => {
        body = d.name;
        draw(body);
        addToTimeline({ name: d.name, discoveryDate: d.discoveryDate });
      });

    const simulation = d3.forceSimulation(bodiesToPack)
      .force("x", d3.forceX(containerX).strength(0.1))
      .force("y", d3.forceY(containerY).strength(0.1))
      .force("collide", d3.forceCollide(d => d.r + 1))
      .on("tick", () => {
        bodyCircles.attr("cx", d => d.x).attr("cy", d => d.y);
        bodiesToPack.forEach(d => {
          const dx = d.x - containerX, dy = d.y - containerY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist + d.r > containerR) {
            const angle = Math.atan2(dy, dx);
            d.x = containerX + (containerR - d.r) * Math.cos(angle);
            d.y = containerY + (containerR - d.r) * Math.sin(angle);
          }
        });
      });
  }

  // --- Draw Function ---
  function draw(body) {
    d3.csv("data/sol_data.csv").then(raw => {
      raw.forEach(d => { d.volume = +d.volume; d.discoveryDate = d.discoveryDate; });

      const sun = raw.find(d => d.eName === body);
      if (!sun) return;
      const sunVolume = sun.volume;

      const bodies = raw.filter(d => d.eName !== "Sun" && d.eName !== body && d.volume > 0);
      const data = {
        name: "Sun",
        children: bodies.map(d => ({
          name: d.eName,
          volumePct: d.volume / sunVolume * 100,
          discoveryDate: d.discoveryDate
        }))
      };

      drawPackedSun(data, body);
      updateTimeline();
    });
  }

  // --- Initial Draw ---
  drawTimelineTemplate();
  draw(body);
});