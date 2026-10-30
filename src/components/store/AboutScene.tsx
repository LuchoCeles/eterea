import styles from "./AboutIllustration.module.css";

export function AboutScene() {
  return (
    <svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice" className="block h-[clamp(250px,31vw,390px)] w-full" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <path d="M0 0h1200v380H0Z" fill="#edf0e9" />
      <path d="M0 290c146-21 247-15 373 5 175 28 318-22 461-9 128 13 235 25 366-1v95H0Z" fill="#dce7df" opacity=".65" />
      <g className={styles.current} fill="none" stroke="#93aaa3" strokeLinecap="round">
        <path d="M-30 245c134-22 215 13 335-4 118-17 219-16 334 2 115 19 222-10 334-3 103 6 174 10 257-8" strokeWidth="1.5" opacity=".65" />
        <path d="M-22 307c157 15 233-14 369-8 117 5 189 22 316 3 122-19 228 6 340 6 84 0 158-10 225-20" strokeWidth="1.5" opacity=".55" />
        <path d="M-25 351c129-18 237-11 337 1 153 19 276-5 396-8 175-4 301 25 520-4" strokeWidth="1" opacity=".45" />
      </g>
      <g className={styles.fabric}>
        <path d="M521 82c22 12 48 19 79 19s57-7 79-19l53 27c26 14 48 34 66 58l-34 32-42-28-4 113c-65 25-171 25-236 0l-4-113-42 28-34-32c18-24 40-44 66-58l53-27Z" fill="#faf7ef" stroke="#acb4a8" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M521 82c19 31 45 48 79 48s60-17 79-48" fill="none" stroke="#b6b9ac" strokeWidth="1.5" />
        <path d="M478 171c23-12 36-30 43-55m201 55c-23-12-36-30-43-55" fill="none" stroke="#d7d4c6" strokeWidth="1.5" />
        <path d="M528 138c-13 45-18 96-14 150m158-150c13 45 18 96 14 150M600 131c-4 53-4 103 0 173" fill="none" stroke="#ddd9cd" strokeWidth="1.4" opacity=".8" />
        <path d="M488 278c62 23 162 26 224 0" fill="none" stroke="#b6b9ac" strokeWidth="1.2" strokeDasharray="3 5" />
      </g>
      <g className={styles.ripple} fill="none" stroke="#8fa9a0" strokeLinecap="round" opacity=".55">
        <path d="M86 278c69-11 127-9 179 0m641-4c72-13 136-11 201 1" strokeWidth="1.2" />
        <path d="M128 322c43-5 83-4 118 1m708-5c54-6 100-5 140 0" strokeWidth="1" />
      </g>
    </svg>
  );
}
