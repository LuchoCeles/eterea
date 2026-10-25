import styles from "./NotFoundScene.module.css";

const shorelinePath = "M0 470c124-36 220-23 322 2 137 33 237 22 378-9";

export function NotFoundScene() {
  return (
    <svg viewBox="0 0 700 650" preserveAspectRatio="xMidYMid slice" className="block aspect-[7/5] w-full" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <defs>
        <linearGradient id="sky404" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5eee0" />
          <stop offset="1" stopColor="#d9ded5" />
        </linearGradient>
        <linearGradient id="water404" gradientUnits="userSpaceOnUse" x1="0" y1="320" x2="0" y2="650">
          <stop offset="0" stopColor="#aebfbb" />
          <stop offset="1" stopColor="#6f918e" />
        </linearGradient>
        <linearGradient id="sand404" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfd4bd" />
          <stop offset="1" stopColor="#eee5d4" />
        </linearGradient>
        <g id="fanShell404">
          <path d="M0 24C-15 17-27 4-27-8c0-5 4-8 9-7 2-6 8-9 13-6 5-6 12-6 17-1 6-3 12 1 13 7 6 0 10 5 8 11C29 8 15 19 0 24Z" fill="#d8b7a0" stroke="#9f806c" strokeWidth="2" strokeLinejoin="round" />
          <path d="M0 22C-8 9-14-4-18-15M0 22C-3 7-5-8-5-21M0 22C3 6 8-8 12-22M0 22C9 9 19-4 25-15" fill="none" stroke="#f3ddc7" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g id="spiralShell404">
          <path d="M-29 9c-5-12-1-27 11-35 14-10 32-7 41 5 10 12 7 29-5 38C5 27-19 24-29 9Z" fill="#d9b69d" stroke="#987b6b" strokeWidth="2" strokeLinejoin="round" />
          <path d="M-12 8c0-11 8-20 19-20 10 0 17 7 16 16-1 8-7 13-14 13-6 0-10-4-10-9 0-4 3-7 7-7 3 0 5 2 5 5" fill="none" stroke="#8f7365" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </defs>

      <path fill="url(#sky404)" d="M0 0h700v650H0z" />
      <circle className={styles.sun} cx="528" cy="148" r="74" fill="#f8e8c5" opacity=".82" />
      <circle cx="528" cy="148" r="95" fill="none" stroke="#f8e8c5" strokeWidth="1" opacity=".52" />
      <g className={styles.seaSurface}>
        <path d="M0 320c98 13 175 6 270-9 116-19 214-13 430 2v337H0Z" fill="url(#water404)" />
        <path d="M0 322c96 14 172 6 268-10 113-19 219-13 432 2" fill="none" stroke="#f9f2e4" strokeWidth="2" opacity=".75" />
      </g>
      <path d={`${shorelinePath}V700H0Z`} fill="url(#sand404)" />
      <g className={styles.tide}>
        <path d="M0 340H700V463c-141 31-241 42-378 9C220 447 124 434 0 470Z" fill="url(#water404)" />
        <path className={styles.waveFar} d="M-35 381c67-23 119 11 187-2 66-13 113-12 163 3 56 16 113-19 178-8 69 12 119 21 202-2" fill="none" stroke="#f6eee0" strokeWidth="2" opacity=".42" />
        <path className={styles.waveMiddle} d="M-30 422c83 15 120-19 192-6 76 14 113 25 180 3 72-23 117-8 173 7 78 21 133-17 211-8" fill="none" stroke="#f8f0e2" strokeWidth="2.5" opacity=".5" />
        <path className={styles.waveNear} d="M-35 457c75-24 133 2 191-8 71-12 100-5 161 12 62 18 116-21 180-14 68 7 111 22 164 8 32-9 60-10 81-7" fill="none" stroke="#f8f0e2" strokeWidth="3" opacity=".58" />
        <path className={styles.waveRipples} d="M41 396c25-5 47-4 66 0m224 5c27-7 48-6 66-1m187-4c30-6 54-4 72 2M94 442c31-7 54-6 78-1m356-5c21-4 41-3 60 2" fill="none" stroke="#f8f0e2" strokeWidth="1.5" strokeLinecap="round" opacity=".35" />
        <path d={shorelinePath} fill="none" stroke="#fbf5e9" strokeWidth="5" opacity=".85" />
      </g>
      <path d="M77 516c61-12 91-7 145 3M490 511c49-7 79-4 122 2" fill="none" stroke="#c6b79b" strokeWidth="2" opacity=".6" />

      <path d="M-20 108Q321 278 720 91" fill="none" stroke="#827b69" strokeWidth="2.5" />
      <g className={styles.shirt}>
        <path d="M240 179v34" stroke="#827b69" strokeWidth="2" />
        <path d="M224 183h32" stroke="#877d6b" strokeWidth="5" strokeLinecap="round" />
        <path d="M240 209v11m0 0-49 27q-5 3 1 3h96q6 0 1-3l-49-27Zm-42 30h84" fill="none" stroke="#827b69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M183 242 152 260l-17 54 33 13 14-31 6 125c25 10 72 10 103 0l6-125 15 31 33-13-19-54-32-18h-28l-26 26-29-26Z" fill="#f8f3e9" stroke="#b7aa97" strokeWidth="2" strokeLinejoin="round" />
        <path d="m211 242 29 26 26-26m-26 26v148m-51-20c26 7 72 8 100 0" fill="none" stroke="#c4b8a5" strokeWidth="2" />
        <circle cx="240" cy="300" r="2" fill="#a8957c" /><circle cx="240" cy="329" r="2" fill="#a8957c" /><circle cx="240" cy="358" r="2" fill="#a8957c" />
        <path d="M142 311c11 6 24 9 32 10m126 0c13-3 24-7 35-12" fill="none" stroke="#d9cebc" strokeWidth="2" />
      </g>

      <g className={styles.dress}>
        <path d="M463 174v38" stroke="#827b69" strokeWidth="2" />
        <path d="M447 179h32" stroke="#877d6b" strokeWidth="5" strokeLinecap="round" />
        <path d="M463 209v11m0 0-37 27q-4 3 1 3h72q5 0 1-3l-37-27Zm-31 30h62" fill="none" stroke="#827b69" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M433 241 408 260l-16 47 27 12 12-24 4 48c-9 30-22 66-40 97 34 21 101 27 139 3-18-33-31-70-39-100l3-48 14 24 26-12-17-47-25-19q-12 22-33 22t-30-22Z" fill="#bd9e88" stroke="#8d7668" strokeWidth="2" strokeLinejoin="round" />
        <path d="M438 245q10 21 25 21t28-21m-56 98q30 8 60 0m-78 68c28 13 74 18 96 11" fill="none" stroke="#ead9c7" strokeWidth="2" opacity=".75" />
        <path d="M453 269v68m21-68v68" stroke="#d8bea9" strokeWidth="2" opacity=".6" />
      </g>

      <use href="#fanShell404" transform="translate(66 482) rotate(-18) scale(.3)" />
      <use href="#spiralShell404" transform="translate(139 496) rotate(22) scale(.27)" />
      <use href="#fanShell404" transform="translate(202 487) rotate(13) scale(.24)" />
      <use href="#spiralShell404" transform="translate(336 502) rotate(-12) scale(.31)" />
      <use href="#fanShell404" transform="translate(402 506) rotate(27) scale(.28)" />
      <use href="#spiralShell404" transform="translate(516 517) rotate(16) scale(.25)" />
      <use href="#fanShell404" transform="translate(586 519) rotate(-24) scale(.32)" />
      <use href="#spiralShell404" transform="translate(651 510) rotate(9) scale(.24)" />
    </svg>
  );
}
