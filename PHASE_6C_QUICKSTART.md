# Phase 6C Quick Start - Personas & Use Cases

**TL;DR**: Add the "human layer" - who does the work (Personas) and what they do (Use Cases).

## The Hierarchy

```
Domain → Subdomain → **Persona** → **Use Case** → Workflow → Agent → Tool
```

## Key Concepts

### Persona
A human role in the airline. Examples:
- Crew Controller
- Flight Dispatcher
- Gate Agent
- Maintenance Coordinator

**Contains**: Pain points, goals, responsibilities, systems used, day-in-life timeline

### Use Case
A specific task a persona performs. Examples:
- "Handle crew sick call"
- "Create flight plan"
- "Resolve boarding pass issue"

**Contains**: Steps, frequency, ROI analysis, current vs. future state

## Why This Matters

1. **Use-Case-First Approach**: Start with real work, then determine what tech is needed
2. **ROI Justification**: Calculate value before building ($47K/year savings for one use case!)
3. **Prioritization**: Build what saves the most time/money/pain first
4. **Customer Demo**: Show Copa exactly how AI helps their people

## Quick Numbers

**Sample Use Case: "Handle Crew Sick Call"**
- Current: 45 min, 85% success, $56K/year cost
- With AI: 10 min, 98% success, $9K/year cost
- **Savings: $47K/year, 314% ROI**

## Implementation Waves

**Wave 1 (MVP for Copa Demo)**:
- 3-5 key personas
- 10-15 critical use cases
- ROI calculator
- Basic UI

**Wave 2 (Full Feature Set)**:
- Advanced analysis
- Tool certification
- External system stubs

**Wave 3 (Scale & Polish)**:
- Multi-airline support
- Advanced visualizations
- Executive dashboards

## Next Steps

1. Read full guide: `PHASE_6C_IMPLEMENTATION.md`
2. Interview Copa personas to identify pain points
3. Document 10-15 high-value use cases
4. Calculate ROI for each
5. Build Wave 1 in priority order

## Files

- `PHASE_6C_IMPLEMENTATION.md` - Full implementation guide (30+ pages)
- `PHASE_6C_QUICKSTART.md` - This file
- Schema changes - Add personas, use_cases, day_in_life tables
- API routes - /api/personas, /api/use-cases
- UI components - PersonaDetail, UseCaseDetail, DayInLifeView

---

**Status**: Ready for implementation after Copa persona discovery sessions
