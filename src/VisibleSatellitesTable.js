import React, { useEffect } from "react";
import PropTypes from "prop-types";
import useVisibleSatellites from "./useVisibleSatellites";
import styles from "./VisibleSatellitesTable.css";
import {uniqBy, path, sort} from "ramda";
import {toFixedFloat} from "./utils";

export default function VisibleSatellitesTable(props) {
	const {tles, lat, lng} = props;

	const [
		visibleSatellites,
		{ pause, unpause }
	] = useVisibleSatellites(tles, lat, lng);

	const uniq = uniqBy(sat => sat.tleArr[0], visibleSatellites);

	const forDisplay = uniq
		.filter((satellite) => satellite.info.elevation > 20);

	const diff = (a, b) => b.info.elevation - a.info.elevation;
	const forDisplaySorted = sort(diff, forDisplay);

	return (
		<div>
			<h2>Summary</h2>
			<ul>
				<li>{ visibleSatellites.length } above horizon</li>
				<li>{ forDisplaySorted.length } above 40 degrees</li>
			</ul>
			<table className={styles.container}>
				<thead>
					<tr><td>Name</td><td>Elevation</td><td>Azimuth</td><td>Lat</td><td>Lng</td><td>Range</td><td>Velocity</td><td>Speed relative to observer</td></tr>
				</thead>
				<tbody>
					{
						forDisplaySorted.map(satellite => {
							const { info, tleArr } = satellite;
							const { elevation, lat, lng, range, velocity, azimuth } = info;
							const [name] = tleArr;

							return (
								<tr key={ name }><td>{ name }</td><td>{ toFixedFloat(elevation) }°</td><td>{ toFixedFloat(azimuth) }°</td><td>{ toFixedFloat(lat, 4) }</td><td>{ toFixedFloat(lng, 4) }</td><td>{ toFixedFloat(range) } km</td><td>{ toFixedFloat(velocity * 60 * 60) } km/h</td><td>{ toFixedFloat(velocity / range, 6) }</td></tr>
							);
						})
					}
				</tbody>
			</table>
		</div>
	);
}

VisibleSatellitesTable.propTypes = {
	tles: PropTypes.string
};

VisibleSatellitesTable.defaultProps = {
	tles: []
};
