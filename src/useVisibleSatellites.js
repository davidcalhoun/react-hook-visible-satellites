import { useState, useEffect } from "react";
import { getVisibleSatellites } from "tle.js";
import { uniqBy } from "ramda";

import { splitRawTLEs, useVisibilityChange, useInterval } from "./utils";

/**
 *
 */
export default function useVisibleSatellites(
	rawTLEs,
	observerLat,
	observerLng,
	refreshMS = 1000
) {
	let [satellites, setSatellites] = useState({
		allTLEs: [],
		fastSatelliteTLEs: [],
		lastFullRecalculation: null,
		visibleSatellites: [],
		visibleSatellitesSlow: []
	});
	let [
		documentIsVisible,
		{ setVisibilityListener, unsetVisibilityListener }
	] = useVisibilityChange();
	let [isPaused, setIsPaused] = useState(false);

	let {
		allTLEs,
		fastSatelliteTLEs,
		lastFullRecalculation,
		visibleSatellites,
		visibleSatellitesSlow
	} = satellites;

	// Initialization
	useEffect(() => {
		// Watches for document show/hide events, so CPU time isn't wasted while offscreen.
		setVisibilityListener();

		return () => {
			unsetVisibilityListener();
		};
	}, []);

	// Refreshes visible satellites.
	useInterval(() => {
		updatePositions();
	}, refreshMS);

	useEffect(() => {
		const tleArr = splitRawTLEs(rawTLEs);
		const allTLEs = uniqBy(arr => arr[1], tleArr);

		recalculateAllPositions(allTLEs);
	}, [rawTLEs]);

	useEffect(() => {
		if (documentIsVisible) {
			unpause();
			// Page just became visible again, so a full refresh is needed.
			recalculateAllPositions();
		}
	}, [documentIsVisible]);

	function updatePositions() {
		if (isPaused) return;

		// Periodically refresh both slow and fast moving satellites.
		if (Date.now() - lastFullRecalculation > 10000) {
			recalculateAllPositions();
		} else {
			fastRecalculate();
		}
	}

	// Recalculates only fast satellites.
	function fastRecalculate() {
		setSatellites({
			...satellites,
			visibleSatellites: [
				...visibleSatellitesSlow,

				// Update fast-moving more frequently.
				...getVisibleSatellites({
					observerLat,
					observerLng,
					observerHeight: 0,
					tles: fastSatelliteTLEs
				})
			]
		});
	}

	function recalculateAllPositions(newTLEs) {
		const tles = newTLEs || allTLEs;

		if (tles.length === 0) return;

		const newVisible = getVisibleSatellites({
			observerLat,
			observerLng,
			observerHeight: 0,
			tles,
			timestampMS: Date.now()
		});

		const fast = newVisible.filter(
			satellite => satellite.info.velocity / satellite.info.range >= 0.001
		);

		setSatellites({
			allTLEs: tles,
			fastSatelliteTLEs: fast.map(sat => sat.tleArr),
			lastFullRecalculation: Date.now(),
			visibleSatellites: newVisible,
			visibleSatellitesSlow: newVisible.filter(
				satellite =>
					satellite.info.velocity / satellite.info.range < 0.001
			)
		});
	}

	function pause() {
		setIsPaused(true);
	}
	function unpause() {
		setIsPaused(false);
	}

	return [satellites.visibleSatellites, { pause, unpause }];
}
