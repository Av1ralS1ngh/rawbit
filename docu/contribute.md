# rawBit Contribution Ideas

rawBit is a visual educational tool for constructing and understanding Bitcoin transactions and protocol flows on a canvas.

This document collects the main directions where contributions are welcome. It is meant both for new contributors and for students exploring a possible project idea.

rawBit is open source, so anyone can contribute. Some contributors may also participate through structured programs and receive more active mentoring, but contributions are not limited to those programs.

---

## What rawBit is optimizing for

rawBit is not a wallet and not a production transaction tool.

The goal of rawBit is educational:

- make Bitcoin transaction mechanics easier to understand
- make Bitcoin Script execution visible step by step
- connect protocol concepts to concrete transaction structures
- make preimages, witnesses, scripts, weights, and stack states easier to inspect
- help students, educators, and protocol-curious developers reason about Bitcoin visually

This means the best contributions are usually not “more features” in the abstract, but improvements that make Bitcoin concepts clearer, more teachable, and easier to inspect.

---

## What makes a strong rawBit contribution

A strong contribution is usually:

- **Educationally useful**  
  It helps someone understand Bitcoin better.

- **Visually manageable**  
  It does not overload the canvas without a clear reason.

- **Concrete**  
  It focuses on a specific flow, mechanism, failure mode, or comparison.

- **Inspectable**  
  The user can meaningfully inspect values, scripts, preimages, witnesses, stack states, or transaction structure.

A contribution does **not** need to be huge to be valuable.

---

## Main contribution areas

The most useful contributions currently fall into five groups:

1. **New educational flows / lessons**
2. **Review and improvement of existing flows**
3. **Documentation and onboarding**
4. **Video tutorials / demos**
5. **Bug fixes, tests, and small quality-of-life improvements**

All of these are valuable.

---

## 1. New educational flows / lessons

This is the most natural contribution area for rawBit.

A “flow” in rawBit is an interactive lesson or protocol example built visually on the canvas. The best flows usually focus on one concept clearly, instead of trying to explain too many things at once.

### Promising directions

#### Bitcoin transaction basics

- Better P2PKH / P2SH / SegWit introductory lessons
- Fee / weight comparisons across transaction types
- “Why this transaction is invalid” debugging lessons
- TXID vs WTXID focused examples

#### Timelocks and spending conditions

- More CLTV / CSV examples
- Relative vs absolute timelock comparison
- Escrow / refund structures
- More advanced payment channel patterns

#### Lightning Network

This is one of the strongest directions for a larger project.

Possible subtopics:

- HTLC basics
- Commitment transaction structure
- Channel open / close
- Success and timeout branches
- Revocation concepts
- Penalty path intuition
- Anchor outputs
- Routing-related or trampoline-related flows, if the scope stays concrete and educational

Lightning is attractive because it has enough complexity for a substantial project.

#### CoinJoin

Possible directions:

- CoinJoin basics
- Transaction structure and privacy intuition
- Why equal outputs matter
- Common input ownership heuristic and how CoinJoin breaks it
- Interactive lesson comparing a normal multi-party transaction vs CoinJoin
- Common mistakes when trying to model CoinJoin

CoinJoin can be a very good lesson if kept focused and educational.

#### Mining / block construction

Possible directions:

- From transactions to candidate block
- Coinbase transaction
- Merkle tree / Merkle root
- Block header structure
- PoW target / nonce intuition
- Why mining is about block headers, not “mining transactions directly”

This is a strong educational direction, especially as a “what happens after transactions” lesson.

#### PSBT

Possible directions:

- PSBT basics
- Separation of creation / signing / finalization
- Comparing raw transaction flow vs PSBT workflow
- Multi-party signing flow

#### Miniscript

Possible directions:

- Basic Miniscript policy ideas
- Mapping policy to Script structure
- Comparing handwritten Script vs structured policy

#### Covenant proposals / experimental ideas

Possible directions:

- OP_CAT sketches
- CTV-style educational demos
- Other covenant-related transaction patterns

These should be clearly marked as educational / experimental.

#### Other protocol flows

The suggestions above are not strict limits. Contributors are welcome to propose their own idea if it fits rawBit well and has clear educational value.

---

## 2. Review and improvement of existing flows

rawBit already includes multiple lessons, from basic transaction types through Taproot and MuSig2, but they can always be improved.

This kind of contribution is very useful because it does not require inventing a completely new protocol flow from scratch.

### Possible directions

- Review an existing lesson for clarity
- Suggest a simpler layout or better grouping on the canvas
- Reduce visual clutter
- Improve naming of nodes
- Improve lesson summaries
- Add small exercises or prompts
- Identify where a student is likely to get confused
- Suggest where a flow should be split into smaller parts
- Identify places where edges or groups overload the canvas

### Especially useful kinds of feedback

- “This flow is technically correct but difficult to follow”
- “These nodes should probably be grouped differently”
- “This lesson needs a clearer entry point”
- “This concept is missing one supporting explanation”
- “This existing lesson could become two smaller lessons”

### Lessons that may especially benefit from review

Complex lessons tend to benefit most from design review:

- Taproot script-path lessons
- Taproot multisig
- MuSig2
- future Lightning flows

For simpler flows like P2PKH, P2WPKH, or P2SH, the basic node design already works well. More complex protocols usually need more iteration to avoid overloading the canvas.

---

## 3. Documentation and onboarding

This is a very important area.

A technically strong tool still needs a good entry point.

### Useful documentation contributions

- “How to approach a rawBit lesson”
- “How to design a new rawBit flow”
- Contributor guide for frontend + backend changes
- First-time setup guide improvements
- Recommended first lessons for new users
- Educational guide to what each lesson is trying to teach
- Glossary of recurring terms used in rawBit
- More screenshots / annotated screenshots
- Examples of how to review a flow critically

### Good onboarding questions to address

- Where should a new user start?
- How should someone read a flow?
- What does a typical node represent?
- What belongs in frontend structure vs backend logic?
- How do you know a lesson is “done”?
- How should someone think about educational clarity vs technical completeness?

### Docs that would be especially helpful

- `How to approach a rawBit lesson`
- `How to propose a new flow`
- `How to design nodes without overloading the canvas`
- `How frontend nodes and backend calculation logic fit together`

---

## 4. Video tutorials / demos

Video work is welcome, especially short and focused educational demos.

The most useful videos are not necessarily full walkthroughs. Shorter videos can be very effective if they clearly demonstrate one strong point.

### Good video ideas

- Short P2PKH demo showing raw transaction templates and field filling
- Short debugger demo showing where Script execution fails
- Intro to the rawBit canvas and lesson structure
- Compare raw code / raw transaction hex vs visual flow in rawBit
- Short Taproot visual demo
- “Why this transaction failed” mini-debugging video
- Overview of how one lesson is structured

### A natural video style for rawBit

- screen recording
- focused voiceover
- one concept per video
- fast visual payoff
- educational but motivating

Not every video needs to be a complete long lesson. Short, strong demos are valuable too.

---

## 5. Bug fixes, tests, and quality-of-life improvements

rawBit is educational, but code quality still matters.

### Useful technical contributions

- Fix frontend bugs
- Fix backend logic issues
- Improve tests
- Improve local setup
- Improve error reporting
- Improve stability of existing flows
- Improve performance of recalculation for larger flows
- Fix visual rough edges in node behavior
- Improve inspector / debugger usability

### Especially useful

- Better test coverage for new flow-related logic
- Backend correctness for new calculation nodes
- Improvements that make failures easier to understand
- Small fixes that reduce confusion for first-time users

---

## Design philosophy for flows

There is no strict formal design system yet, but there are some practical principles.

### General pattern

Normally:

- one node represents one operation  
  for example hashing, signing, conversion, serialization, or verification
- template nodes often combine multiple inputs from top to bottom into one structured artifact

### What has worked well

This approach works well for simpler flows like:

- P2PKH
- P2WPKH
- P2SH
- basic timelock examples

### What gets harder

More complex flows can become visually overloaded:

- MuSig2 is a good example
- future Lightning flows will likely have similar challenges

### Practical design advice

For more complex flows:

- design first for education, not maximum compression
- start simple, then iterate
- avoid too many crossing edges
- group related steps clearly
- split concepts if one canvas gets too dense
- prefer clarity over showing every possible detail at once

In practice, frontend flow design and backend logic usually go together. It is often difficult to design frontend nodes well without also understanding what backend logic is needed.

---

## What makes a strong proposal?

If you want to propose a new flow or a larger contribution, a strong proposal usually includes:

- a short explanation of the concept
- why it is educationally useful
- which existing rawBit lesson is closest to it
- how the flow might be structured visually
- what backend logic would be needed
- where the difficult parts are
- what would count as a good final result

For larger mentored projects, it is usually **not** necessary to submit a fully finished flow immediately. A strong design and implementation plan is often more useful than a rushed partial implementation.

---

## Signals of strong preparation

Contributors who want to stand out should try to show that they:

- understand basic Bitcoin transaction structure, for example P2PKH
- understand basic Script execution
- reviewed some existing rawBit lessons
- can give concrete feedback on existing flows
- can explain clearly why their proposed contribution matters

That kind of preparation is usually more valuable than simply saying “I want to work on Lightning” in the abstract.

---

## Suggested first steps for contributors

A good way to start:

1. Run rawBit locally
2. Explore several existing lessons
3. Identify one concrete improvement, review point, or new flow idea
4. Discuss the idea first
5. Then open an issue or PR if it makes sense

Even if there are no formal GitHub issues yet for a topic, discussing a concrete idea first is often the best path.
Community discussion is also available on [Discord](https://discord.gg/5vRnYSZc).

---

## If you are not part of a formal program

You can still contribute.

rawBit is an open-source project. Formal programs may add structure and active mentoring, but they are not the only path.

If you want to contribute outside a program:

- discuss the idea first if possible
- open a PR
- keep the scope focused
- aim for something educationally useful and reviewable

---

## Suggested idea bank

Below is a non-exhaustive list of ideas that currently look promising.

### New flow ideas

- Lightning HTLC intro
- Lightning commitment transaction basics
- Lightning timeout / success branch comparison
- CoinJoin basics
- CoinJoin structure and privacy intuition
- Mining / candidate block construction
- Coinbase transaction lesson
- Merkle root and block header lesson
- PSBT basics
- Miniscript basics
- Covenant proposal demos
- Debugging lesson for invalid P2WSH or Taproot spend

### Review ideas

- Review Lesson 8 for clarity
- Review Lesson 13 for visual overload
- Review Lesson 14 for educational accessibility
- Compare lesson summaries and propose a better structure
- Identify lessons that should include exercises

### Docs ideas

- Onboarding guide
- Recommended first lessons
- Contributor guide for creating flows
- Design notes for frontend node layout
- Educational design principles for rawBit

### Video ideas

- Short P2PKH intro
- Raw code vs rawBit visual flow
- Short Script debugger demo
- Short Taproot demo
- Intro to how a lesson is structured

---

## What not to optimize for

Not every technically impressive contribution is a good rawBit contribution.

Things to avoid:

- making flows huge without improving understanding
- trying to model everything at once
- adding features that do not help education or inspection
- turning a lesson into a giant protocol encyclopedia
- prioritizing novelty over clarity

The best rawBit contributions usually make one thing much clearer.

---

## Final note

rawBit is still evolving, and contribution directions will evolve with it.

This document is not a strict contract. It is meant to make the project easier to approach and to show the kinds of contributions that are likely to be useful.

If you have an idea that is not listed here but fits rawBit well from an educational perspective, feel free to propose it.
