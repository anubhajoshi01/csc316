// draw an svg

const WIDTH = 1000;
const HEIGHT = 700;

let visSvg = d3.select("#chart-area").append("svg")
			.attr("width", WIDTH)
			.attr("height", HEIGHT);

visSvg.append("circle")
    .attr("class", "sun")
    .attr("r", 30)
    .attr("cy", HEIGHT / 2)
    .attr("cx", 40);

// Box-Muller transform for normal distribution sampling
function normalRandom(mean = 0, stdDev = 1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + stdDev * normal;
}

function drawVis(data, planetsOnly) {
    console.log("the data", data);
    
    // filter planets
    let planetsData = data.filter((body) => body.is_planet)
    console.log("planets only", planetsData)

    // count moons of planets
    planetsData.forEach(planet => {
        let moonCount = data.filter(d => d.orbits_planet === planet.name && !d.is_planet).length;
        planet.moon_count = moonCount;
    });

    // Create a log scale for x-axis (planet distance from sun)
    let maxDistance = d3.max(planetsData, p => p.semi_major_axis);
    let minDistance = d3.min(planetsData, p => p.semi_major_axis);
    
    let xScale = d3.scalePow()
        .exponent(0.7)
        .domain([minDistance, maxDistance])
        .range([120, WIDTH - 100]);

    // lets draw the planets !?
    let planets = visSvg.selectAll(".planet")
        .data(planetsData)

    // some manual adjustments to spread out the planets a bit more    
    let planetShifts = {'Mercury': -40, 'Venus': 150, 'Earth': -120, 'Mars': 75, 'Uranus': 35, '136472-Makemake': -20, '136199-Eris': -15}

    planets.enter().append("circle")
        .attr("class", p => `planet ${p.name.toLowerCase()}`)
        .attr("id", (p) => "id" + p.name)
        .attr("cy", (p, i) => {     // spread out the planets idk
            let yval = i % 2 == 0 ? -i : i
            let ypos = (p.semi_major_axis) + HEIGHT / 2 + yval * 20 * Math.min(p.semi_major_axis, 1) + (planetShifts[p.name] || 0)
            return ypos
        })
        .attr("cx", (p, i) => xScale(p.semi_major_axis) - 35)
        .attr("r", 8)

    // Sun -> planets
    const SUN_X = 40;
    const SUN_Y = HEIGHT / 2;

    visSvg.selectAll(".planet-link")
        .data(planetsData)
        .enter().append("line")
        .attr("class", "planet-link")
        .attr("x1", SUN_X)
        .attr("y1", SUN_Y)
        .attr("x2", p => +d3.select("#id" + p.name).attr("cx"))
        .attr("y2", p => +d3.select("#id" + p.name).attr("cy"))
        .lower();

    // Saturn ring
    const saturn = d3.select("#idSaturn");

    visSvg.insert("ellipse", "#idSaturn")
        .attr("class", "saturn-ring")
        .attr("cx", saturn.attr("cx"))
        .attr("cy", saturn.attr("cy"))
        .attr("rx", saturn.attr("r") * 3)
        .attr("ry", saturn.attr("r") * 1.5)
        .attr("transform", `rotate(-20 ${saturn.attr("cx")} ${saturn.attr("cy")})`);
    
    // add some labels
    let planetLabels = visSvg.selectAll(".planet-label")
        .data(planetsData)

    let moonlessPlanets = planetsData.filter(p => p.moon_count === 0).map(p => p.name);

    planetLabels.enter().append("text")
        .text((p) => p.realName)
        .attr("class", "planet-label")
        .attr("text-anchor", (p) => moonlessPlanets.includes(p.name) ? "start" : "end")
        .attr("x", (p) => +d3.select("#id" + p.name).attr("cx") + (moonlessPlanets.includes(p.name) ? 12 : -15))
        .attr("y", (p) => +d3.select("#id" + p.name).attr("cy") + 5)

    // build moon-free safe zones around every planet and its label
    const PLANET_SAFE_RADIUS = 30;
    const LABEL_PADDING = 4;

    // for planets
    const circleZones = planetsData.map(p => ({
        cx: +d3.select("#id" + p.name).attr("cx"),
        cy: +d3.select("#id" + p.name).attr("cy"),
        r: PLANET_SAFE_RADIUS
    }));

    // for their labels
    const rectZones = [];
    visSvg.selectAll(".planet-label").each(function() {
        const bbox = this.getBBox();
        rectZones.push({
            x: bbox.x - LABEL_PADDING,
            y: bbox.y - LABEL_PADDING,
            w: bbox.width  + LABEL_PADDING * 2,
            h: bbox.height + LABEL_PADDING * 2
        });
    });

    function isInAnySafeZone(x, y) {
        // check if coords land inside either circular or rectangular safe zone
        if (circleZones.some(z => {
            const dx = x - z.cx, dy = y - z.cy;
            return dx * dx + dy * dy < z.r * z.r;
        })) return true;
        if (rectZones.some(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h)) return true;
        return false;
    }
    
    // some silly asteroids / comets -- non-planets with primary orbits
    // let asteroidData = data.filter((body) => !body.is_planet && body.orbit_type === "Primary")
    // console.log("asteroids etc", asteroidData)

    // let asteroids = visSvg.selectAll(".asteroid")
    //     .data(asteroidData)

    // asteroids.enter().append("circle")
    //     .attr("class", "planet")
    //     .attr("id", (a) => "id" + a.name)
    //     .style("fill", "#efefef")
    //     .attr("cy", (a, i) => {     // spread out the planets idk
    //         let yval = i % 2 == 0 ? -i : i
    //         return (a.semi_major_axis) + HEIGHT / 2 + yval * 5
    //     })
    //     .attr("cx", (a, i) => (a.semi_major_axis * 16) + 70)
    //     .attr("r", 4)
    
    // time to add the orbiting bodies. or whatever
    // dont want to include asteroids that orbit other asteroids (for now, we can talk about this)
    let planetList = ["1-Ceres", "136199-Eris", "Uranus", "Pluto", "Neptune", "136108-Haumea", 
        "136472-Makemake", "Jupiter", "Mars", "Mercury", "Saturn", "Earth", "Venus"
    ]
    let moonsData = data.filter((body) => !body.is_planet && body.orbit_type !== "Primary" 
        && planetList.includes(body.orbits_planet))
    console.log("the moons", moonsData)

    let moons = visSvg.selectAll("moons")
        .data(moonsData)

    // Precompute moon positions with rejection sampling to avoid safe zones
    const MAX_PLACEMENT_TRIES = 100;
    moonsData.forEach(m => {
        const hostX = +d3.select("#id" + m.orbits_planet).attr("cx");
        const hostY = +d3.select("#id" + m.orbits_planet).attr("cy");
        const hostPlanet = data.find(d => d.name === m.orbits_planet);
        const distanceScale = hostPlanet.moon_count * 0.3 + 10;
        let x, y, tries = 0;
        do {
            const yOffset = normalRandom(0, distanceScale);
            const xOffset = normalRandom(hostPlanet.moon_count + 30, hostPlanet.moon_count * 0.4 + 10);
            x = hostX + xOffset;
            y = hostY + yOffset;
            tries++;
        } while (isInAnySafeZone(x, y) && tries < MAX_PLACEMENT_TRIES);
        m._moonX = x;
        m._moonY = y;
    });

    moons.enter().append("circle")
        .attr("class", "moon")
        .attr("id", (m) => "id" + m.name)
        .attr("cy", (m) => m._moonY)
        .attr("cx", (m) => m._moonX)
        .attr("r", 2)

    visSvg.selectAll("circle.moon").each(function(m) {
        const moonNode = this;
        const moon = d3.select(moonNode);

        const host = visSvg.select("#id" + m.orbits_planet);
        if (host.empty()) return;

        visSvg.insert("line", () => moonNode)
            .attr("class", "moon-link")
            .attr("x1", +host.attr("cx"))
            .attr("y1", +host.attr("cy"))
            .attr("x2", +moon.attr("cx"))
            .attr("y2", +moon.attr("cy"))
            .lower();
    });
    // add year ranges, for timeline bar at the top 
    let minYear = d3.min(data, (d) => d.discovery_year);
    let maxYear = d3.max(data, (d) => d.discovery_year);
    console.log("minyear", minYear)
    console.log("maxyear", maxYear)
    
    // the number of sections we wanna have? subject to change
    const NUM_TIMEPERIODS = 5;

    const sectionWidth = 800 / NUM_TIMEPERIODS;
    let colors = ["#074665ff", "#1670a1ff", "#3dafd2ff", "#4fcaddff", "#6cdae0ff", "#a4f1f1ff"]

    // make it interactive
    for (let i = 0; i <= NUM_TIMEPERIODS; i++) {
        visSvg.append("rect")
            .attr("id", "time-section-" + i)
            .attr("x", 50 + i * sectionWidth)
            .attr("y", 50)
            .attr("width", sectionWidth)
            .attr("height", 10)
            .style("fill", colors[i]);
        d3.select("#time-section-" + i).on("mouseover", function() {
            d3.select(this).style("fill", "red")
                .attr("height", 15)
                .attr("y", 47.5);
            for (let body of data) {
                if ((body.discovery_year <= minYear + (i) * (maxYear - minYear) / NUM_TIMEPERIODS)
                    && (body.discovery_year > minYear + (i-1) * (maxYear - minYear) / NUM_TIMEPERIODS)) {
                    d3.select("#id" + body.name).style("fill", "red");
                    console.log("body", body.name, body.discovery_year)
                }
            }
        });
        d3.select("#time-section-" + i).on("mouseout", function() {
            d3.select(this).style("fill", colors[i])
                .attr("height", 10)
                .attr("y", 50);
            for (let body of data) {
                if (body.discovery_year <= minYear + (i) * (maxYear - minYear) / NUM_TIMEPERIODS) {
                    d3.select("#id" + body.name).style("fill", null);
                }
            }
        });
    }
}