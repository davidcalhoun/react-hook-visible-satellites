import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import useVisibleSatellites from "./useVisibleSatellites";
import styles from "./VisibleSatellitesProjection.css";
import {uniqBy, path, sort} from "ramda";
import { toFixedFloat, satelliteAzimElevToXY } from "./utils";

function doOverlap(leftTopA, rightBottomA, leftTopB, rightBottomB) {
    // Horizontal side-by-side check
	if (leftTopA.x > rightBottomB.x || leftTopB.x > rightBottomA.x) {
		return false;
	}

	// Vertical side-by-side check
	// if (leftTopA.y < rightBottomB.y || leftTopB.y < rightBottomA.y) {
	// 	return false;
	// }
	if (rightBottomA.y < leftTopB.y || leftTopA.y > rightBottomB.y) {
		return false;
	}

	return true;
}

function hasTextOverlap({ ctx, allTextPositions, targetX, targetY, targetWidth, targetHeight, targetName }) {
	return allTextPositions.some(({ x, y, width, height, name }) => {
		const overlap = doOverlap(
			{x, y: y - height},
			{x: x + width, y: y},
			{x: targetX, y: targetY - targetHeight},
			{x: targetX + targetWidth, y: targetY}
		);

		// debug
		// ctx.fillStyle = "green";
		// ctx.fillRect(x, y - height, 5, 5);
		// ctx.fillStyle = "blue";
		// ctx.fillRect(x + width, y, 5, 5);

		return overlap;
	});
}

function Canvas(props) {
	const container = useRef(null);

	const { satellites } = props;

	const updateCanvas = () => {
		if (container && container.current) {
			const width = container.current.getBoundingClientRect().width;
			const height = container.current.getBoundingClientRect().height;
			const smallerDim = width < height ? width : height;

			const ctx = container.current.getContext("2d");

			ctx.clearRect(0, 0, width, height);

			// Draw circular horizon.
			const horizonLineWidth = 2;
			const margin = 5;
			ctx.beginPath();
			ctx.arc(width / 2, height / 2, smallerDim / 2 - horizonLineWidth - margin, 0, 360, false);
			ctx.lineWidth = horizonLineWidth;
			ctx.strokeStyle = "#400000";
			ctx.stroke();

			ctx.strokeStyle = "#A20000";

			// Keep track of XY positions to handle text overlap scenarios.
			const satTextPositions = [];

			props.satellites.forEach(satellite => {
				const { info, tleArr } = satellite;
				const { azimuth, elevation, velocity, range } = info;
				const [name] = tleArr;

				const [x, y] = satelliteAzimElevToXY(
					azimuth,
					elevation,
					smallerDim,
					width / 2,
					height / 2
				);

				// Draw satellite with name.
				const {
					width: textWidth
				} = ctx.measureText(name.trim());
				const textHeight = 12;

				const isFastMoving = velocity / range > 0.001;
				const isOver30Degrees = elevation >= 30;

				let textX = parseInt(x - textWidth / 2);
				let textY = parseInt(y + textHeight + 5);
				const hasOverlap = hasTextOverlap({
					ctx,
					allTextPositions: satTextPositions,
					targetX: textX,
					targetY: textY,
					targetWidth: textWidth,
					targetHeight: textHeight,
					targetName: name
				});

				ctx.fillStyle = (isFastMoving && isOver30Degrees) ? "red": "#820000";
				ctx.font = `${ textHeight }px serif`;

				if (hasOverlap) {
					textY = textY + textHeight;
					//console.log(222)
				} else {
					//console.log(444)
				}

				if (isFastMoving) {
					ctx.fillText(name, textX, textY);
					ctx.fillRect(x, y, 5, 5);

					satTextPositions.push({
						x: textX,
						y: textY,
						width: textWidth,
						height: textHeight,
						name
					});
				} else {
					ctx.fillRect(x, y, 2, 2);
				}
			});
		}
	};

	useEffect(() => {
		if (window.devicePixelRatio) {
			const width = container.current.getBoundingClientRect().width;
			const height = container.current.getBoundingClientRect().height;

			const ctx = container.current.getContext("2d");
			container.current.setAttribute(
				"width",
				width * window.devicePixelRatio
			);
			container.current.setAttribute(
				"height",
				height * window.devicePixelRatio
			);
			container.current.setAttribute(
				"style",
				`width: ${width}px; height: ${height}`
			);

			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
	});

	useEffect(() => {
		updateCanvas();
	}, [satellites]);

	return <canvas ref={container} className={props.className} />;
}

Canvas.defaultProps = {
	satellites: [],
	
}

export default function VisibleSatellitesProjection(props) {
	const { tles, lat, lng, style } = props;

	const [visibleSatellites, { pause, unpause }] = useVisibleSatellites(
		tles,
		lat,
		lng,
		1000
	);

	const container = useRef(null);

	const handleToggleFullscreen = () => {
		if (!document.fullscreenElement) {
			container.current.requestFullscreen().catch(err => {
				alert(
					`Error attempting to enable full-screen mode: ${err.message} (${err.name})`
				);
			});
		} else {
			document.exitFullscreen();
		}
	};

	const uniq = uniqBy(sat => sat.tleArr[0], visibleSatellites);

	const forDisplay = uniq.filter(satellite => satellite.info.elevation > 10);

	return (
		<div className={styles.container} ref={container} style={style}>
			<button onClick={handleToggleFullscreen}>Toggle fullscreen</button>
			<Canvas satellites={forDisplay} className={styles.canvas} />
		</div>
	);
}

VisibleSatellitesProjection.propTypes = {
	tles: PropTypes.string
};

VisibleSatellitesProjection.defaultProps = {
	tles: []
};
