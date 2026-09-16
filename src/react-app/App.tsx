import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ParticleScene } from "./ParticleScene";
import type { Phase } from "./sceneModel";
import "./App.css";

type RevealWord = { baseStart: number; length: number; text: string; wordStart: number };
const WORDMARK = "Plexigent";
const REVEAL_WORDS = ["ComPlex", "exigent", "Intelligent", "Plexippus"];

function getRevealWord(text: string): RevealWord {
	const base = WORDMARK.toLowerCase();
	const word = text.toLowerCase();
	let best = {
		baseStart: 0,
		length: 0,
		wordStart: 0,
	};

	for (let baseStart = 0; baseStart < base.length; baseStart += 1) {
		for (let wordStart = 0; wordStart < word.length; wordStart += 1) {
			let length = 0;

			while (
				base[baseStart + length] &&
				word[wordStart + length] &&
				base[baseStart + length] === word[wordStart + length]
			) {
				length += 1;
			}

			if (length > best.length) {
				best = { baseStart, length, wordStart };
			}
		}
	}

	return { ...best, text };
}

function isMatchedLetter(index: number, revealWord: RevealWord | undefined) {
	if (!revealWord) {
		return false;
	}

	return (
		index >= revealWord.baseStart &&
		index < revealWord.baseStart + revealWord.length
	);
}


function App() {
	const [phase, setPhase] = useState<Phase>("loading");
	const stageRef = useRef<HTMLDivElement>(null);
	const wordmarkRef = useRef<HTMLHeadingElement>(null);
	const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const overlayRef = useRef<HTMLSpanElement>(null);
	const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const revealWords = useMemo(() => REVEAL_WORDS.map(getRevealWord), []);
	const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
	const [isRevealVisible, setIsRevealVisible] = useState(false);
	const [isSequenceRunning, setIsSequenceRunning] = useState(false);
	const sequenceRunRef = useRef(0);
	const timerRef = useRef(0);
	const activeReveal = activeRevealIndex === null ? undefined : revealWords[activeRevealIndex];

	useEffect(() => () => {
		sequenceRunRef.current++;
		window.clearTimeout(timerRef.current);
	}, []);

	useLayoutEffect(() => {
		const stage = stageRef.current;
		const heading = wordmarkRef.current;
		if (!stage || !heading) return;
		let alive = true;
		const measure = () => {
			if (!alive) return;
			const base = heading.querySelector(".wordmark-base") as HTMLElement;
			const baseWidth = base.getBoundingClientRect().width;
			const origin = heading.getBoundingClientRect().left;
			let extent = baseWidth / 2;
			for (const [index, word] of revealWords.entries()) {
				const row = measureRefs.current[index];
				const anchor = letterRefs.current[word.baseStart];
				const borrowed = row?.children[word.wordStart];
				if (!row || !anchor || !borrowed) continue;
				const prefix = borrowed.getBoundingClientRect().left - row.getBoundingClientRect().left;
				const left = anchor.getBoundingClientRect().left - origin - prefix;
				extent = Math.max(extent, baseWidth / 2 - left, left + row.getBoundingClientRect().width - baseWidth / 2);
			}
			const font = parseFloat(getComputedStyle(heading).fontSize);
			const desired = Math.min(160, stage.clientWidth * .15, stage.clientHeight * .18);
			const available = Math.max(1, stage.clientWidth - 40);
			const fitted = Math.min(desired, font * available / Math.max(1, 2 * extent));
			if (Math.abs(font - fitted) > .1) heading.style.fontSize = `${fitted}px`;
			if (activeRevealIndex !== null && overlayRef.current) {
				const row = measureRefs.current[activeRevealIndex];
				const word = revealWords[activeRevealIndex];
				const anchor = letterRefs.current[word.baseStart];
				const borrowed = row?.children[word.wordStart];
				if (row && anchor && borrowed) {
					const prefix = borrowed.getBoundingClientRect().left - row.getBoundingClientRect().left;
					overlayRef.current.style.left = `${anchor.getBoundingClientRect().left - heading.getBoundingClientRect().left - prefix}px`;
				}
			}
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(stage);
		void document.fonts.ready.then(measure);
		return () => { alive = false; observer.disconnect(); };
	}, [activeRevealIndex, revealWords]);

	const startRevealSequence = async () => {
		if (isSequenceRunning) return;
		const runId = ++sequenceRunRef.current;
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const fade = reduced ? 120 : 850;
		const wait = (duration: number) => new Promise<void>(resolve => {
			timerRef.current = window.setTimeout(resolve, duration);
		});
		setIsSequenceRunning(true);
		for (let index = 0; index < revealWords.length; index++) {
			if (sequenceRunRef.current !== runId) return;
			flushSync(() => { setActiveRevealIndex(index); setIsRevealVisible(false); });
			await wait(40);
			if (sequenceRunRef.current !== runId) return;
			setIsRevealVisible(true);
			await wait(fade + 1150);
			if (sequenceRunRef.current !== runId) return;
			setIsRevealVisible(false);
			await wait(fade);
		}
		if (sequenceRunRef.current === runId) {
			setActiveRevealIndex(null);
			setIsSequenceRunning(false);
		}
	};

	return (
		<main className={`landing phase-${phase}`} aria-label="Plexigent introduction">
			<div className="aura aura-one" aria-hidden="true" />
			<div className="aura aura-two" aria-hidden="true" />
			<div className="signal-grid" aria-hidden="true" />
			<div className="scene-safe-area">
				<div className="scene-stage" ref={stageRef}>
					<ParticleScene stageRef={stageRef} onPhase={setPhase} />
					<div className="wordmark-stage">
						<h1 className="wordmark" ref={wordmarkRef}>
							<span className="wordmark-base" aria-label={WORDMARK}>
								{WORDMARK.split("").map((letter, index) => (
									<span
										key={`${letter}-${index}`}
										ref={(element) => {
											letterRefs.current[index] = element;
										}}
										className={`base-letter ${
											isRevealVisible && isMatchedLetter(index, activeReveal)
												? "matched"
												: ""
										} ${
											isRevealVisible && !isMatchedLetter(index, activeReveal)
												? "dimmed"
												: ""
										}`}
									>
										{letter}
									</span>
								))}
							</span>
							{activeReveal ? (
								<span
									aria-hidden="true"
									className={`wordmark-overlay ${isRevealVisible ? "visible" : ""}`}
									ref={overlayRef}
								>
									{activeReveal.text.split("").map((letter, index) => {
										const isBorrowed =
											index >= activeReveal.wordStart &&
											index < activeReveal.wordStart + activeReveal.length;

										return (
											<span
												key={`${activeReveal.text}-${letter}-${index}`}
												className={isBorrowed ? "borrowed-letter" : ""}
											>
												{letter}
											</span>
										);
									})}
								</span>
							) : null}
							<span className="wordmark-measurements" aria-hidden="true">
								{revealWords.map((word, index) => (
									<span className="wordmark-measure" key={word.text} ref={element => { measureRefs.current[index] = element; }}>
										{word.text.split("").map((letter, i) => <span key={i}>{letter}</span>)}
									</span>
								))}
							</span>
						</h1>
						<button
							type="button"
							className={`question-orb ${isSequenceRunning ? "hidden" : ""}`}
							aria-label="Reveal Plexigent word associations"
							onClick={startRevealSequence}
							disabled={phase !== "done" || isSequenceRunning}
						>
							<span aria-hidden="true">?</span>
						</button>
					</div>
				</div>
			</div>
		</main>
	);
}
export default App;
