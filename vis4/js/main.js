// Create svg canvas
const width = 1000;  
const height = 800;

const svg = d3.select("#vis4")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Panel dimensions
const panelWidth = 800 / 2;
const panelHeight = height / 2;

// Define the 4 systems
const panels = [
    { name: "Sun", x: 0, y: 0 },
    { name: "Saturn", x: panelWidth, y: 0 },
    { name: "Neptune", x: 0, y: panelHeight },
    { name: "Uranus", x: panelWidth, y: panelHeight }
];

// Load data
d3.csv("data/sol_data.csv").then(data => {

    data.forEach(d => {
        d.eccentricity = +d.eccentricity;
        d.meanRadius = +d.meanRadius;
    });

    data.sort((a, b) => b.eccentricity - a.eccentricity);

    let mostEccentric = data.slice(0, 5);
    let earth = data.find(d => d.eName === "Earth");
    if (earth) mostEccentric.push(earth);

    // Planet size scale
    let radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.meanRadius)])
        .range([4, 18]);

    // Categorical color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(mostEccentric.map(d => d.eName));

    // Create panel groups
    const panelGroups = svg.selectAll(".panel")
        .attr("class", "panel")
        .attr("id", d => `panel-${d.name.toLowerCase()}`)
        .data(panels)
        .enter()
        .append("g")
        .attr("class", "panel")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Panel titles
    panelGroups.append("text")
        .attr("x", panelWidth / 2)  // Center the title horizontally
        .attr("y", 30)             // Position the title just above the panel
        .attr("text-anchor", "middle") // Center the text horizontally
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .text(d => d.name);

    panelGroups.select("#panel-sun")
        .append("text")
        .attr("x", panelWidth / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "gray")
        .text("Note: Sun's orbiting bodies are shown for comparison");

    // Panel borders
    panelGroups.append("rect")
        .attr("width", panelWidth)
        .attr("height", panelHeight)
        .attr("fill", "none")
        .attr("stroke", "#ddd");

    // Draw each system
    panelGroups.each(function(panel) {

        const g = d3.select(this);
        const centerX = panelWidth / 2;
        const centerY = panelHeight / 2;

        const centralBody = data.find(d => d.eName === panel.name);
        if (!centralBody) return;

        // Central body color
        const centralColors = {
            Sun: "yellow",
            Saturn: "#dbcd4e",
            Neptune: "#4e79a7",
            Uranus: "#59a14f"
        };

        // Draw central body
        g.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", radiusScale(centralBody.meanRadius))
            .attr("fill", centralColors[panel.name])
            .attr("stroke", "black");

        // Orbiting objects
        const orbiters = mostEccentric.filter(obj => {
            if (panel.name === "Sun") return obj.orbits === "NA";
            return obj.orbits === panel.name;
        });

        const baseA = 60;
        const spacing = 35;

        orbiters.forEach((object, i) => {

            const e = object.eccentricity;
            const a = baseA + i * spacing;
            const c = a * e;
            const b = a * Math.sqrt(1 - e * e);

            const cx = centerX - c;
            const cy = centerY;

            const planetColor = colorScale(object.eName);

            // Orbit
            g.append("ellipse")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("rx", a)
                .attr("ry", b)
                .attr("fill", "none")
                .attr("stroke", planetColor)
                .attr("stroke-width", 2);

            // Size proportional to central body
            const centralRadius = radiusScale(centralBody.meanRadius);

            // Control how large orbiting objects appear relative to parent
            const proportionalFactor = 0.25;  // adjust between 0.15–0.35

            const orbitingRadius = centralRadius * proportionalFactor;

            g.append("circle")
                .attr("cx", cx + a)
                .attr("cy", cy)
                .attr("r", orbitingRadius)
                .attr("fill", planetColor)
                .attr("stroke", "black");

            });

        });

    
    // ------- Legend -------
    const legend = svg.append("g")
        .attr("transform", `translate(820, 60)`);

    legend.append("text")
        .text("Orbiting Bodies")
        .attr("font-size", 16)
        .attr("font-weight", "bold")
        .attr("y", -20);

    const legendItems = legend.selectAll(".legend-item")
        .data(mostEccentric)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 5)
        .text((d, i) => `${i + 1}. ${d.eName}`)
        .attr("font-size", 14);

    legendItems.append("circle")
        .attr("r", 8)
        .attr("fill", d => colorScale(d.eName))
        .attr("stroke", "black");
});
