function orbitData(csvPath, discardNonPlanets = true) {
    return d3.csv(csvPath, function(d) {
        // Select desired features and convert types
        return {
            name: d.eName.replace(/ /g, "-"),       // html-friendly for classes/ids
            orbits_planet: d.orbits.replace(/ /g, "-"),
            orbit_type: d.orbit_type,
            discovery_year: d.discoveryDate,
            is_planet: d.isPlanet === "TRUE",
            radius: +d.meanRadius,
            mass: +d.mass_kg,
            semi_major_axis: +d.semimajorAxis / 149597870       // in astronomical units
        }
    }).then((data) => {
        // Delete copy of original columns
        delete data.columns;

        // Unify discovery year format and convert to number
        for (let i = 0; i < data.length; i++) {
            data[i].discovery_year = +data[i].discovery_year.slice(-4);
        }

        // Filter out primary bodies that are not planets if desired
        if (discardNonPlanets) {
            data = data.filter(d => d.is_planet && d.orbit_type === "Primary");
        }
        console.log("hello")
        drawVis(data, discardNonPlanets);
        
    });
}

orbitData('data/sol_data.csv', false)