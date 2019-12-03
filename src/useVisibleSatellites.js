import { useState, useEffect } from "react";
import { splitRawTLEs, useVisibilityChange } from "./utils";
import * as TLEJS from "tle.js";
const tlejs = new TLEJS();

/**
 *
 */
export default function useVisibleSatellites(
	rawTLEs,
	lat,
	lng,
	refreshMS = 5000
) {
	let [satellites, setSatellites] = useState({
		visibleSatellites: [],
		processedTLEs: [],
		processedTLEsFastSats: []
	});
	let [documentIsVisible, { setVisibilityListener, unsetVisibilityListener }] = useVisibilityChange();

	let {
		visibleSatellites,
		processedTLEs,
		processedTLEsFastSats
	} = satellites;

	let tles;
	let isPaused = false;
	let visible;
	let slowMoving;
	let fastMoving;
	let fastMovingTLEs;
	let lastFullRecalculation;

	useEffect(() => {
		tles = splitRawTLEs(rawTLEs);

		recalculateAllPositions();

		setSatellites({
			processedTLEs: tles,
			processedTLEsFastSats: fastMovingTLEs,
			visibleSatellites: visible
		});

		// Watch for document show/hide events, so we don't use up CPU while offscreen.
		setVisibilityListener();

		const timer = setInterval(() => {
			if (isPaused) return;

			// Periodically refresh fastmoving TLEs
			if (Date.now() - lastFullRecalculation > 10000) {
				recalculateAllPositions();
			}

			setSatellites({
				...satellites,
				visibleSatellites: [
					...slowMoving,
					...tlejs.getVisibleSatellites(lat, lng, 0, fastMovingTLEs)
				]
			});
		}, refreshMS);
		return () => {
			clearInterval(timer);
			unsetVisibilityListener();
		};
	}, [rawTLEs]);

	useEffect(() => {
		if (documentIsVisible) {
			unpause();
			// Page just became visible again, so a full refresh is needed.
			recalculateAllPositions();
		}
	}, [documentIsVisible]);

	function recalculateAllPositions() {
		console.log(Date.now(), recalculateAllPositions);
		visible = tlejs.getVisibleSatellites(lat, lng, 0, tles);
		slowMoving = visible.filter(
			satellite => satellite.info.velocity / satellite.info.range <= 0.001
		);
		fastMoving = visible.filter(
			satellite => satellite.info.velocity / satellite.info.range > 0.001
		);
		fastMovingTLEs = fastMoving.map(sat => sat.tleArr);

		lastFullRecalculation = Date.now();
	}

	function pause() {
		isPaused = true;
	}
	function unpause() {
		isPaused = false;
	}

	/**
	 * Traverses entire list of TLEs and updates currently visible satellites.
	 * Note: high-cost operation.
	 */
	// function updateVisibleSatellites() {
	// 	console.log('updating', visibleSatellites)

	// }

	/**
	 * Lower-cost operation to update the positions of satellites we already know are visible.
	 */
	// function updateOnlyCurrentlyVisibleSatellites() {

	// }

	return [visibleSatellites, { pause, unpause }];
}
