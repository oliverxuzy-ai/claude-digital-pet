import type { PetDefinition, PetMood } from '../types.js';

const catFrames: Record<PetMood, string[]> = {
  idle: [
    `
  /\\_/\\
 ( o.o )
  > ^ <
 /|   |\\
(_|   |_)`,
    `
  /\\_/\\
 ( o.o )
  > ^ <
 /|   |\\
(_|   |_)~`,
  ],
  happy: [
    `
  /\\_/\\
 ( ^.^ )
  > ^ <
 /|   |\\
(_|   |_) ♪`,
  ],
  hungry: [
    `
  /\\_/\\
 ( -.o )
  > ~ <
 /|   |\\
(_|   |_)...`,
  ],
  sleeping: [
    `
  /\\_/\\
 ( -.- ) z
  > ^ <  Z
 /|   |\\  z
(_|   |_)`,
  ],
  eating: [
    `
  /\\_/\\
 ( ^o^ )
  > ^ < ~♡
 /|   |\\
(_|   |_)`,
  ],
  playing: [
    `
  /\\_/\\  ⚽
 ( >w< )  /
  > ^ < /
 /|   |/
(_|   |_)`,
  ],
  sad: [
    `
  /\\_/\\
 ( T.T )
  > ~ <
 /|   |\\
(_|   |_)`,
  ],
};

const dogFrames: Record<PetMood, string[]> = {
  idle: [
    `
 /^ ^\\
( o o )
 (   )
  U U
 /| |\\`,
    `
 /^ ^\\
( o o )
 (   ) ~
  U U
 /| |\\`,
  ],
  happy: [
    `
 /^ ^\\
( ^ ^ )
 ( v ) ~♪
  U U
 /| |\\`,
  ],
  hungry: [
    `
 /v v\\
( o . )
 (   )
  U U ...
 /| |\\`,
  ],
  sleeping: [
    `
 /v v\\
( - - ) z
 (   )  Z
  U U
 /| |\\`,
  ],
  eating: [
    `
 /^ ^\\
( ^o^ ) ♡
 ( ~ )
  U U
 /| |\\`,
  ],
  playing: [
    `
 /^ ^\\  ⚽
( >o< ) /
 ( v )/
  U U
 /| |\\`,
  ],
  sad: [
    `
 /v v\\
( ; ; )
 (   )
  U U
 /| |\\`,
  ],
};

const gooseFrames: Record<PetMood, string[]> = {
  idle: [
    `
    __
   / o>
  |  |
 /|  |\\
/ |  | \\
  ~~  ~~`,
    `
    __
   / o>
  |  |
 /|  |\\
/ |  | \\
 ~~  ~~`,
  ],
  happy: [
    `
    __
   / ^> ♪
  |  |
 /|  |\\
/ |  | \\
  ~~  ~~ HONK!`,
  ],
  hungry: [
    `
    __
   / ->
  |  |
 /|  |\\
/ |  | \\
  ~~  ~~...`,
  ],
  sleeping: [
    `
    __
   / ->  z
  |  |   Z
 /|  |\\
/ |  | \\
  ~~  ~~`,
  ],
  eating: [
    `
    __
   / o> ~🍞
  |  |
 /|  |\\
/ |  | \\
  ~~  ~~ nom!`,
  ],
  playing: [
    `
    __     ⚽
   / o>  /
  |  | /
 /|  |/
/ |  | \\
  ~~  ~~ HONK!`,
  ],
  sad: [
    `
    __
   / ;>
  |  |
 /|  |\\
/ |  | \\
  ~~  ~~`,
  ],
};

export const petDefinitions: Record<string, PetDefinition> = {
  cat: { name: 'Cat', emoji: '🐱', frames: catFrames },
  dog: { name: 'Dog', emoji: '🐶', frames: dogFrames },
  goose: { name: 'Goose', emoji: '🪿', frames: gooseFrames },
};

export function getPetFrame(petType: string, mood: PetMood, tick: number): string {
  const def = petDefinitions[petType];
  if (!def) return '???';
  const frames = def.frames[mood] || def.frames.idle;
  return frames[tick % frames.length];
}
