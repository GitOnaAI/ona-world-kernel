Following up on the balance question, since the PRD for the whole epic is committed here. A few things to carry forward into PR3/PR5 so overall balance stays in view as the content lands. None of this blocks PR1: the primitives are content-unused and the goldens are untouched, so nothing shifts until an ability or signature actually grants them. These are for when it does.

Worth grounding the whole discussion in one fact: player interrupts and cast-while-moving do not exist in the game today (the lockout aura is mob-only, and every cast cancels on movement). So the row content introduces two genuinely new power axes, which is why they are worth watching.

Two I would treat as must-fix in the PR that first wires a player interrupt, not just tuning:

1. Gate hostile interrupts to consented PvP. A player interrupt applies a lockout aura, which is hostile control, and the #96 pvp_safety invariant forbids that between players outside a duel/arena/fiesta. `pvp_safety.test.ts` currently covers poly, auto-attack, frost-nova, fear, and stun, but not the interrupt to lockout path. Route lockout application through the same consent check and add the interrupt case to that test. The parity gate will not catch this (it detects drift, not "too strong").

2. Wire diminishing returns onto the lockout/silence family. DR (`diminishedCrowdControlDuration`) covers only stun/fear/poly today; the interrupt branch makes no DR call. With every class getting an interrupt option and no DR, two staggered interrupters on roughly 10 to 12s cooldowns can keep a healer's primary school locked for most of every window in 2v2. That is a machinery gap, not a number, so it needs building before the content can be tuned around it.

Watch-items for the PR5 tuning pass (numbers can handle these, just keep them in view):

- Caster-vs-melee tilt. Interrupts only bite non-physical casts, and interrupt abilities are physical (so uninterruptible themselves), which favors melee into casters. Cast-while-moving (Firestarter, Netherwind) is the intended offset, so tune the two axes together rather than in isolation.
- Priest Silence is a full 4s all-school silence (not a single-school lockout) on a 30s cd; with no DR that is a near-guaranteed kill window in 2v2. Highest-impact single option in the draft.
- Presence of Mind's value is removing Pyroblast's 6s cast window, not raising its number. The cross-class rule already keeps guaranteed-crit (rogue) and instant-nuke (mage) on different classes, so the levers are the 60s cd and the opportunity cost against the row's passive.
- Mage kite. The game ships cheap no-cooldown snares (Frostbolt 40%, Hamstring) and zero snare/root breaks in any kit, so a mobile Scorch compounds hard, and specifically on the mage.

One suggestion: the flat one-of-three-per-row structure makes a full 3^6 = 729-build-per-class enumeration cheap for the headless sim, and there is no cross-class balance test today (the parity gate is a drift detector, not a balance oracle). A build sweep in PR5 would give you an actual balance check at exactly the point where power-per-option is highest.

Last one: consider an explicit uninterruptible flag before interrupt content ships. Right now "cannot interrupt this" is implicit (a cast is safe only if it is physical-school or a scripted string absent from `ABILITIES`, which is how Nythraxis's wipe cast stays safe). A future boss cast that uses a real ability id would become interruptible by accident.
