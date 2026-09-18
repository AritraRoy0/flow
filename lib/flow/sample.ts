import { uid } from "./helpers";
import type { Argument, Clash, Poi } from "./types";

export const sampleUBIDebate = (): {
  arguments: Argument[];
  clashes: Clash[];
  pois: Poi[];
  notes: Record<string, string>;
  motion: string;
  govTeam: string;
  oppTeam: string;
  roundLabel: string;
} => ({
  motion: "THW Implement Universal Basic Income (UBI)",
  govTeam: "Affirm",
  oppTeam: "Negate",
  roundLabel: "UBI Sample Debate",
  arguments: [
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Framework: Stability and freedom are the evaluation criteria",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "We should evaluate policies by their ability to stabilize income and expand real freedom from coercion.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: Freedom isn't just absence of coercion, it requires resources and opportunity.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "Exactly — and UBI provides the baseline resources that enable opportunity.",
                  side: "GOV",
                  speech: "MG",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Contention 1: UBI eliminates welfare cliffs and poverty traps",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Current welfare creates benefit cliffs where taking a raise means losing support — making work economically irrational.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: People still respond to marginal incentives; they're not purely trapped.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "But when the marginal return is negative, rational actors avoid it. UBI makes every additional hour worked a strict gain.",
                  side: "GOV",
                  speech: "MG",
                  replies: [
                    {
                      id: uid(),
                      text: "Then work disincentives come from the cost of living, not the cliff.",
                      side: "OPP",
                      speech: "MO",
                      replies: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          text: "Admin burden of means-testing excludes those most in need — proof, paperwork, stable housing all required.",
          side: "GOV",
          speech: "PMC",
          replies: [
            {
              id: uid(),
              text: "Opp: But digitization makes admin easier now than before.",
              side: "OPP",
              speech: "LOC",
              replies: [
                {
                  id: uid(),
                  text: "Even digitized, it requires stable internet, literacy, mental bandwidth poverty strips away.",
                  side: "GOV",
                  speech: "MG",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [
        "Welfare cliff in US: earn $1 more, lose $3 in benefits",
        "60% of eligible UK families don't claim disability benefits due to application complexity",
        "Universal child allowance has 95%+ uptake vs. means-tested TANF at 26% uptake",
      ],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "PMC",
      title: "Contention 2: UBI is an automatic recession stabilizer",
      status: "open",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Recessions spiral when consumers cut spending → business layoffs → more consumers cut spending. UBI breaks the loop.",
          side: "GOV",
          speech: "PMC",
          replies: [],
        },
        {
          id: uid(),
          text: "Low-income households spend nearly 100% of marginal income, creating high multiplier. UBI targets exactly who spends most.",
          side: "GOV",
          speech: "PMC",
          replies: [],
        },
      ],
      examples: [
        "2008 tax rebates: each $1 rebate to low-income households generated $1.50-$2.00 in spending",
        "Finland UBI trial 2017-2018 showed improved well-being without employment reduction",
      ],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Disadvantage: Institutional failure — enforcement through broken systems",
      status: "answered",
      starred: true,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI relies on IRS to distribute automatically, but IRS is underfunded and fails in crises.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: Actually, IRS already runs direct deposit tax refunds; UBI uses existing infrastructure.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "Existing systems also fail — stimulus checks in 2020 took months for homeless populations.",
                  side: "OPP",
                  speech: "MO",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Disadvantage: Inflation — too much money chasing finite goods",
      status: "turned",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI injects trillions into the economy; prices will spike especially in housing and essentials.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: UBI is redistribution, not new money. It transfers from high-MPC wealthy to high-MPC poor.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "But that still increases aggregate demand if funded by taxes (which have lag) or deficit spending.",
                  side: "OPP",
                  speech: "MO",
                  replies: [
                    {
                      id: uid(),
                      text: "Yet UBI stabilizes demand swings — status quo has sharp drops and spikes that worsen inflation dynamics.",
                      side: "GOV",
                      speech: "PMR",
                      replies: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "OPP",
      speech: "LOC",
      title: "Impact turn: UBI creates dependency and reduces autonomy",
      status: "answered",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "Unconditional income support reduces the incentive to improve oneself or seek stable employment.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: Dependency emerges from instability, not support. UBI enables long-term planning and skill development.",
              side: "GOV",
              speech: "MG",
              replies: [],
            },
          ],
        },
      ],
      examples: [],
    },
    {
      id: uid(),
      side: "GOV",
      speech: "MG",
      title: "Extension: Labor market rebalancing (rising reservation wage)",
      status: "open",
      starred: false,
      collapsed: false,
      analysis: [
        {
          id: uid(),
          text: "UBI raises the minimum acceptable job quality — workers refuse exploitation, forcing employers to compete on wages/conditions.",
          side: "GOV",
          speech: "MG",
          replies: [],
        },
      ],
      examples: ["Post-pandemic wage growth in service industries shows workers reject low-wage roles when alternatives exist"],
    },
  ],
  clashes: [
    {
      id: uid(),
      title: "Work incentives: welfare cliffs vs. dependency",
      lean: "GOV",
      weight: "high",
      starred: true,
      collapsed: false,
      speech: "MG",
      weighing:
        "Both sides agree work matters — the question is which system distorts it more. Gov's harm is documented and structural (a negative marginal return), Opp's is speculative and contradicted by every trial. Prefer measured effects over predicted ones.",
      analysis: [
        {
          id: uid(),
          text: "Gov: the cliff makes the marginal hour worth less than nothing — that's a mechanical disincentive, not a behavioural guess.",
          side: "GOV",
          speech: "MG",
          replies: [
            {
              id: uid(),
              text: "Opp: unconditional cash still weakens the pull toward work at the bottom of the ladder.",
              side: "OPP",
              speech: "MO",
              replies: [
                {
                  id: uid(),
                  text: "Gov: trials measured this directly — hours barely move, and the ones that drop are students and new parents.",
                  side: "GOV",
                  speech: "PMR",
                  replies: [],
                },
              ],
            },
          ],
        },
        {
          id: uid(),
          text: "Opp never contests that the cliff exists — only that people respond to it. Dropped: the 60% non-claim rate.",
          side: "GOV",
          speech: "PMR",
          replies: [],
        },
      ],
      examples: [
        "Finland 2017–18: employment flat, well-being up — direct test of the dependency claim",
        "DROPPED by Opp: 95% uptake on universal child allowance vs. 26% on means-tested TANF",
      ],
    },
    {
      id: uid(),
      title: "Macro effect: inflation vs. automatic stabilisation",
      lean: "even",
      weight: "high",
      starred: true,
      collapsed: false,
      speech: "MO",
      weighing:
        "Turns on funding: tax-funded UBI is redistribution (Gov wins), deficit-funded is new demand (Opp wins). Neither side has pinned the funding model down — whoever specifies it first in rebuttal takes the clash.",
      analysis: [
        {
          id: uid(),
          text: "Opp: trillions injected into fixed housing stock spikes prices exactly where the poor spend.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: it's a transfer, not new money — MPC shifts, aggregate demand doesn't.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "Opp: only if it's fully tax-funded with no lag. Deficit funding breaks that answer.",
                  side: "OPP",
                  speech: "MO",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [
        "2008 rebates: $1 to low-income households → $1.50–$2.00 of spending (cuts both ways — multiplier is also the inflation mechanism)",
        "Housing is the contested sector — supply-constrained, so transfers show up as rent",
      ],
    },
    {
      id: uid(),
      title: "Delivery: can the state actually get the money out?",
      lean: "OPP",
      weight: "medium",
      starred: false,
      collapsed: false,
      speech: "LOC",
      weighing:
        "Opp is ahead on the facts here, but it's a solvency discount rather than a reason the policy is bad — it caps Gov's benefit, it doesn't reverse it. Weigh it below the work-incentive clash.",
      analysis: [
        {
          id: uid(),
          text: "Opp: the IRS is underfunded and unreachable for the people who need it most.",
          side: "OPP",
          speech: "LOC",
          replies: [
            {
              id: uid(),
              text: "Gov: the rails already exist — direct-deposit refunds run at national scale every year.",
              side: "GOV",
              speech: "MG",
              replies: [
                {
                  id: uid(),
                  text: "Opp: those rails miss the unbanked and the homeless — 2020 stimulus took months to reach them.",
                  side: "OPP",
                  speech: "MO",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
      examples: [
        "2020 stimulus: months of delay for homeless and unbanked recipients",
        "Gov never answered the maintenance-burden point — only the initial-build point",
      ],
    },
  ],
  pois: [
    {
      id: uid(),
      status: "accepted",
      text: "Don't means-tested systems already give more to those in need?",
      speech: "PMC",
      at: 120,
    },
    {
      id: uid(),
      status: "declined",
      text: "Is $1000/month enough to live on?",
      speech: "LOC",
      at: 240,
    },
    {
      id: uid(),
      status: "accepted",
      text: "How is UBI funded without massive tax increases?",
      speech: "MG",
      at: 380,
    },
  ],
  notes: {
    PMC: "Framework clash on stability+freedom vs. efficiency. Block their concern about cost by pointing to hidden existing costs (emergency services, incarceration, etc.). Lead with welfare cliffs.",
    LOC: "Their institutional failure arg is their best. Focus on IRS dysfunction and underfunding. Don't cede that UBI is simple delivery — maintenance burden matters.",
    MG: "They'll push inflation. Use multiplier econ: redistribution stabilizes demand. Also their dependency arg is backwards — instability causes dependency.",
    MO: "They'll extend inflation and maybe add labor shortage. Labor shortage is actually good — forces wage competition. Inflation needs continuous excess demand.",
    LOR: "Summary: Status quo has cliffs + volatility + hidden costs + dependency. UBI has one clear mechanism. Institutional concerns real but solvable.",
    PMR: "They chose patchwork over replacement. We chose coherent system over fragmented failure. Economic rationality is on our side.",
  },
});
