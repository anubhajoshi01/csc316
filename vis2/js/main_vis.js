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
    
    planets.enter()
        .append("circle")
        .attr("class", p => `planet ${p.name.toLowerCase()}`)
        .attr("cy", (p, i) => {     // spread out the planets idk
            let yval = i % 2 == 0 ? -i : i
            let ypos = (p.semi_major_axis) + HEIGHT / 2 + yval * 20 * Math.min(p.semi_major_axis, 1) + (planetShifts[p.name] || 0)
            return ypos
        })
        .attr("cx", (p, i) => xScale(p.semi_major_axis) - 35)
        .attr("r", 8)
        .style("fill", "black")
        .style("stroke", "black")

    planets.enter()
        .append("circle")
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
        .attr("id", (p) => "link-" + p.name)
        .attr("class", "planet-link")
        .attr("x1", SUN_X)
        .attr("y1", SUN_Y)
        .attr("x2", p => +d3.select("#id" + p.name).attr("cx"))
        .attr("y2", p => +d3.select("#id" + p.name).attr("cy"))
        .lower();

    // Saturn ring
    const saturn = d3.select("#idSaturn");

    visSvg.insert("ellipse", "#idSaturn")
        .attr("id", "saturn-ring")
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
        .attr("id", (p) => "label-" + p.name)
        .text((p) => p.realName)
        .attr("class", "planet-label-small")
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
        const moonName = m.name;

        const host = visSvg.select("#id" + m.orbits_planet);
        if (host.empty()) return;

        visSvg.insert("line", () => moonNode)
            .attr("id", (m) => "link-" + moonName)
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

    // make a timebar
    var timebar = document.getElementById('timebar');

    noUiSlider.cssClasses.target += '-timebar';
    noUiSlider.create(timebar, {
        start: [minYear-10],
        connect: [true, false],
        tooltips: 
            { to: (year) => year <= minYear - 10 ? "Antiquity": `${year} - ${year + 10}`},
        range: {
            'min': minYear - 10,
            'max': maxYear - 10
        },
        step: 1,
        // margin: 10
    });

    var timeValues = [
        document.getElementById('timebar').noUiSlider.get()
    ];

    console.log("timevalues", timeValues)

    timebar.noUiSlider.on("update", (values) => onTimebarUpdate(values, data))
}

function onTimebarUpdate(values, data) {
    // for debugging
    console.log("update timebar values", values)

    let lowerYear = Number(values[0]);
    let upperYear = lowerYear > 1600 ? Number(values[0]) + 10 : 1609;
    console.log(lowerYear, upperYear)
    const transitionDuration = 50
    
    for (let body of data) {
        let x = body.discovery_year;
        let isSaturn = body.name === "Saturn"

        // antiquity condition -- highlight antiquity planets if antiquity is selected
        if (isNaN(x) && (lowerYear < d3.min(data, (d) => d.discovery_year))) {
            d3.select("#id" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1)
                .style("fill-opacity", 1);
            d3.select("#link-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0.7)
                .style("stroke", null)
            d3.select("#label-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1)
            // d3.select("#id" + body.name).style("fill", null);
            if (isSaturn) {d3.select("#saturn-ring").style("opacity", null)}
        }
        // highlight planets in the range
        else if (x >= lowerYear && x <= upperYear) {
            d3.select("#id" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1)
                .style("fill-opacity", 1)
            d3.select("#link-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1)
                .style("stroke", null)
            d3.select("#label-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1)
        } 

        // hide planets that are not discovered yet
        else if (x >= upperYear) {
            console.log("above", body.name)
            d3.select("#id" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0)
                .style("stroke-width", 0)
            d3.select("#label-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0)
            d3.select("#link-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0)
        }

        // planets discovered before time range, show them but with reduced opacity
        else if (isNaN(x) || x < lowerYear) {
            console.log("below", body.name)
            d3.select("#id" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("fill-opacity", 0.3)
                .style("opacity", 1)
                .style("stroke-width", null)
            d3.select("#link-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("stroke", "#2d3648")
                .style("opacity", 0.7)
            d3.select("#label-" + body.name)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 0.5)
            if (isSaturn) {d3.select("#saturn-ring").style("opacity", 0.5)}
        }
    }
}