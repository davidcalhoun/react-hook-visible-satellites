import React, { useEffect } from "react";
import PropTypes from "prop-types";
import useVisibleSatellites from "./useVisibleSatellites";
import styles from "./VisibleSatellitesTable.css";
import { uniqBy, path, sort } from "ramda";
import { toFixedFloat } from "./utils";

const sortByElevation = (a, b) => b.info.elevation - a.info.elevation;

function SatelliteRow(props) {
	const { info, tleArr } = props;
	const { elevation, lat, lng, range, velocity, azimuth } = info;
	const [name] = tleArr;

	return (
		<tr>
			<td>{name}</td>
			<td>{toFixedFloat(elevation)}°</td>
			<td>{toFixedFloat(azimuth)}°</td>
			<td>{toFixedFloat(lat, 2)}</td>
			<td>{toFixedFloat(lng, 2)}</td>
			<td>{toFixedFloat(range)} km</td>
			<td>{toFixedFloat(velocity * 60 * 60)} km/h</td>
			<td>{toFixedFloat(velocity / range, 6)}</td>
		</tr>
	);
}

export default function VisibleSatellitesTable(props) {
	const { tles, lat, lng } = props;

	const [visibleSatellites, { pause, unpause }] = useVisibleSatellites(
		tles,
		lat,
		lng
	);

	const forDisplay = visibleSatellites.filter(satellite => satellite.info.elevation > 20);
	const forDisplaySorted = sort(sortByElevation, forDisplay);

	return (
		<div>
			<h2>Summary</h2>
			<ul>
				<li>{visibleSatellites.length} above horizon</li>
				<li>{forDisplaySorted.length} above 40 degrees</li>
			</ul>
			<table className={styles.container}>
				<thead>
					<tr>
						<td>Name</td>
						<td>Elevation</td>
						<td>Azimuth</td>
						<td>Lat</td>
						<td>Lng</td>
						<td>Range</td>
						<td>Velocity</td>
						<td>Speed relative to observer</td>
					</tr>
				</thead>
				<tbody>
					{forDisplaySorted.map(satellite => {
						return <SatelliteRow key={satellite.tleArr[1]} {...satellite} />;
					})}
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
