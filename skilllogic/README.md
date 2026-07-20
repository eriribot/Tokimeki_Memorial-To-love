# Skill progression

This folder owns the local special-skill graph, term schedule, progression rules, and Zustand state. React components
may render these APIs, but they must not reproduce prerequisite, EXP, term, or six-slot rules locally.

## Public-source basis

- [Gameline skill tables](https://gameline.jp/tokimemo4/tokugi/) provide the six categories, costs, effects, and the
  modern prerequisite summaries.
- [Memoriau 2009 table](http://memoriau.web.fc2.com/tokugi.html) cross-checks the original names and prerequisite
  relationships.
- [Tokimeki Memorial 4 AtWiki system notes](https://w.atwiki.jp/wikiwikits/pages/15.html) describe command-earned skill
  experience and the once-per-term learning opportunity.

The local table has 127 definitions in category counts `25/24/20/26/24/8`. Every listed prerequisite is an AND
requirement. Root definitions begin as `available`, not learned.

## Runtime contract

- Each accepted AP action currently grants one deterministic skill EXP. The source material confirms command-based
  accumulation but not a stable formula that maps cleanly onto this project's smaller command set, so the `1` point
  adapter is named in `skillExperience.ts` and is not presented as an original-game numeric formula.
- Learning spends EXP only in the current academic-term management window. The first window opens on 2008-05-09. A
  window stays open for its term, but missed older terms cannot be backfilled later.
- Learned skills and practiced skills are separate. A term commit may contain at most six unique learned skills and
  becomes the practiced configuration until a later term is committed.
- Licenses cost no EXP and remain external acquisitions. The panel explains the exam requirement; this folder does not
  fabricate an exam result or grant a license without an authoritative caller.
- Skill effects remain descriptive data. They are not yet applied to attribute, success-rate, AP, affection, or story
  settlement.

Only `experience`, `learningHistory`, and `termCommits` are persisted. Statuses, graph closures, the current practiced
set, and the panel's uncommitted draft are derived.
