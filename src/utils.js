import { useState, useEffect } from "react";
import splitEvery from "ramda/src/splitEvery";

const elevToHypLength = (elev, canvasSize) => {
	return canvasSize - (canvasSize * elev) / 89.99999999;
};

export const deg2rad = deg => (Math.PI * 2 * deg) / 360;

export const toFixedFloat = (num = 0, digitsAfterDecimal = 0) =>
	parseFloat(num.toFixed(digitsAfterDecimal));

export const splitRawTLEs = rawText => {
	const arr = rawText.split("\n");
	return splitEvery(3, arr);
};

// return x, y coords in the orientation of compass directions.
// 0 = N, 90 = E, 180 = S, 270 = W

// need to do some basic coord transforms/reflections because the triangle math won't work without 90 deg
// triangles (degress 0-90 only), also to account for compass directions, which are rotated and
// flipped, as opposed to standard math orientation
export const satelliteAzimElevToXY = (
	azim,
	elev,
	canvasSize,
	xOffset = 0,
	yOffset = 0
) => {
	const hyp = elevToHypLength(elev, canvasSize / 2);
	const angle = deg2rad(azim % 90);

	const opp = toFixedFloat(Math.sin(angle) * hyp, 2);
	const adj = toFixedFloat(Math.cos(angle) * hyp, 2);

	let output = [0, 0];

	if (azim >= 0 && azim < 90) {
		output = [opp, -adj];
	}

	if (azim >= 90 && azim < 180) {
		output = [adj, opp];
	}

	if (azim >= 180 && azim < 270) {
		output = [-opp, adj];
	}

	if (azim >= 270 && azim < 360) {
		output = [-adj, -opp];
	}

	output = [output[0] + xOffset, output[1] + yOffset];

	return output;
};

export const debounce = (func, wait, immediate) => {
	let timeout;
	return (...args) => {
		const context = this;
		const later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

export function useVisibilityChange() {
	let isVisible = document.visibilityState === "visible";

	function handleVisibilityChange() {
		isVisible = document.visibilityState === "visible";
	}

	function set() {
		document.addEventListener("visibilitychange", handleVisibilityChange);
	}

	function unset() {
		document.removeEventListener("visibilitychange", handleVisibilityChange);
	}

	return [isVisible, {setVisibilityListener: set, unsetVisibilityListener: unset}]
}

export function useWindowResize() {
	let width = window.innerWidth;
	let height = window.innerHeight;

	function handleResize() {
		width = window.innerWidth;
		height = window.innerHeight;
	}

	function set() {
		window.addEventListener("resize", handleResize);
	}

	function unset() {
		window.removeEventListener("resize", handleResize);
	}

	return [[width, height], {setWindowResize: set, unsetWindowResize: unset}]
}

export function useResizeObserver(node) {
	let width;
	let height;
	let resizeObserverEntries = [];

	function handleResize(entries) {
		resizeObserverEntries = entries;

		const firstEntry = entries && entries[0];
		if (firstEntry) {
			width = firstEntry.contentRect.width;
			height = firstEntry.contentRect.height;
		}
	}

	function set() {
		const resizeObserver = new ResizeObserver(handleResize);

		resizeObserver.observe(node);
	}

	function unset() {
		resizeObserver.unobserve(node);
	}
}
