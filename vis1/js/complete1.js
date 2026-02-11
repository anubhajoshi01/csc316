
// let body = "Sun"


// function drawPackedSun(data, containerName = "Sun") {
//   const width = 500;
//   const height = 500;
//   const centerX = width / 2;
//   const centerY = height / 2;

//   const svg = d3.select("#viz")
//     .attr("width", width)
//     .attr("height", height)
//     .html(""); // clear previous drawings

//   const sunRadius = 200;

//   // --- Draw Sun ---
//   svg.append("circle")
//     .attr("cx", centerX)
//     .attr("cy", centerY)
//     .attr("r", sunRadius)
//     .attr("fill", "#FFD966")
//     .attr("stroke", "#E6A800")
//     .attr("stroke-width", 4);

//   // --- Compute radii proportional to Sun volume ---
//   data.children.forEach(d => {
//     d.r = Math.cbrt(d.volumePct / 100) * sunRadius;
//   });

//   // --- Determine container for packing ---
//   let containerX = centerX;
//   let containerY = centerY;
//   let containerR = sunRadius;

//   if (containerName !== "Sun") {
//     const containerBody = data.children.find(d => d.name === containerName);
//     if (containerBody) {
//       containerX = centerX; // we keep container at Sun center
//       containerY = centerY;
//       containerR = containerBody.r;
//     }
//   }

//   // --- Filter bodies: only include those smaller than container ---
//   const bodiesToPack = data.children.filter(d => d.r < 0.5*containerR);

//   // --- Initialize positions at container center ---
//   bodiesToPack.forEach(d => {
//     d.x = containerX;
//     d.y = containerY;
//   });

//   // --- Color scale ---
//   const color = d3.scaleOrdinal(d3.schemeCategory10)
//     .domain(data.children.map(d => d.name));

//   // --- Hover text ---
//   const hoverText = svg.append("text")
//     .attr("x", width / 2)
//     .attr("y", height - 20)
//     .attr("text-anchor", "middle")
//     .attr("font-family", "sans-serif")
//     .attr("font-size", "14px")
//     .attr("fill", "#333")
//     .text("Hover over a body");

//   // --- Draw bodies ---
//   const bodyCircles = svg.append("g")
//     .selectAll("circle")
//     .data(bodiesToPack)
//     .join("circle")
//     .attr("r", d => d.r)
//     .attr("fill", d => color(d.name))
//     .attr("stroke", "#333")
//     .on("mouseover", (event, d) => {
//       hoverText.text(`${d.name}: ${d.volumePct.toFixed(4)}% of ${containerName} volume`);
//     })
//     .on("mouseout", () => {
//       hoverText.text("Hover over a body");
//     })
//     .on("click", (event, d) => {
//     body = d.name;                // update the container body
//     draw(body);    // redraw inside the clicked body
//     });

//   // --- Force simulation ---
//   const simulation = d3.forceSimulation(bodiesToPack)
//     .force("x", d3.forceX(containerX).strength(0.1))
//     .force("y", d3.forceY(containerY).strength(0.1))
//     .force("collide", d3.forceCollide(d => d.r + 1))
//     .on("tick", () => {
//       bodyCircles
//         .attr("cx", d => d.x)
//         .attr("cy", d => d.y);

//       // Keep bodies inside container
//       bodiesToPack.forEach(d => {
//         const dx = d.x - containerX;
//         const dy = d.y - containerY;
//         const dist = Math.sqrt(dx * dx + dy * dy);
//         if (dist + d.r > containerR) {
//           const angle = Math.atan2(dy, dx);
//           d.x = containerX + (containerR - d.r) * Math.cos(angle);
//           d.y = containerY + (containerR - d.r) * Math.sin(angle);
//         }
//       });
//     });
// }

// function draw(body){

//     d3.csv("data/sol_data.csv").then(raw => {

//     // Parse numbers
//     raw.forEach(d => {
//         d.volume = +d.volume;
//     });

//     // Find the Sun
//     const sun = raw.find(d => d.eName === body);
//     const sunVolume = sun ? sun.volume : null;

//     if (!sunVolume) {
//         console.error("Sun or Sun volume not found in CSV");
//         return;
//     }

//     // Everything except the Sun, with a valid volume
//     const bodies = raw.filter(d =>
//         d.eName !== "Sun" && d.eName !== body &&
//         !isNaN(d.volume) &&
//         d.volume > 0
//     );

//     // Build hierarchy
//     const data = {
//         name: "Sun",
//         children: bodies.map(d => ({
//         name: d.eName,
//         volumePct: d.volume / sunVolume * 100,
//         isPlanet: d.isPlanet,
//         orbits: d.orbits
//         }))
//     };

//     drawPackedSun(data, body);
//     });

//     d3.select("#resetButton").on("click", () => {
//         body = "Sun";          
//         draw(body); 
//     });

// }

// draw(body)


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
      hoverText.text(`${d.name}: ${d.volumePct.toFixed(4)}% of ${containerName} volume`);
    })
    .on("mouseout", () => {
      hoverText.text(`Hover over a body to see volume relative to ${containerName}`);
    })
    .on("click", (event, d) => {
      body = d.name;
      draw(body);
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
        orbits: d.orbits
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
