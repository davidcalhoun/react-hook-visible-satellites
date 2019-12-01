import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import useVisibleSatellites from "./useVisibleSatellites";
import styles from "./VisibleSatellitesProjection.css";
import uniqBy from "ramda/src/uniqBy";
import path from "ramda/src/path";
import sort from "ramda/src/sort";
import { toFixedFloat, satelliteAzimElevToXY } from "./utils";

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
			ctx.fillStyle = "green";

			// Draw circular horizon.
			const horizonLineWidth = 2;
			ctx.beginPath();
			ctx.arc(width / 2, height / 2, smallerDim / 2 - horizonLineWidth, 0, 360, false);
			ctx.lineWidth = horizonLineWidth;
			ctx.strokeStyle = "#66CC01";
			ctx.stroke();

			props.satellites.forEach(satellite => {
				// TODO: check for overlapping sats
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
					width: textWidth,
					emHeightDescent: textHeight
				} = ctx.measureText(name.trim());

				const isFastMoving = velocity / range > 0.001;
				ctx.fillStyle = isFastMoving ? "red": "#820000";
				ctx.font = "12px serif";
				if (isFastMoving) {
					ctx.fillText(`${name}`, x - textWidth / 2, y + 18);
					ctx.fillRect(x, y, 5, 5);
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
	const { tles, lat, lng } = props;

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

	useEffect(() => {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				if (entry.contentBoxSize) {
					console.log(222, entries);
				}
			}
		});

		resizeObserver.observe(container.current);

		return () => resizeObserver.unobserve(container.current);
	}, [tles]);

	return (
		<div className={styles.container} ref={container}>
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
